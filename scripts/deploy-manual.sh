#!/usr/bin/env bash
# =============================================================================
# Manual, SHA-pinned production deploy for CarCareBooker on the Lightsail host.
#
# DRY-RUN BY DEFAULT. Without --execute this script only reads: it inspects the running
# container, checks the commit, and prints every command it WOULD run. Nothing is built,
# tagged, stopped, started or fetched.
#
#   GitHub -> Lightsail checkout -> Docker image -> carcarebooker -> 127.0.0.1:8084 -> Nginx
#
# Usage (on the Lightsail host):
#   scripts/deploy-manual.sh deploy   <40-char-sha>            [--execute] [options]
#   scripts/deploy-manual.sh rollback <carcarebooker-prev-...> [--execute] [options]
#
# Options:
#   --repo DIR               Git checkout on the host   (default /home/ubuntu/CarCareBooker)
#   --public-url URL         Public origin to verify    (default https://p91carcare.com)
#   --allow-non-main         Permit a SHA that is not contained in origin/main
#   --accept-container-diff  Proceed although the running container has written files
#                            outside /app/uploads (they are listed first; they are NOT kept)
#
# What it never does: push, change Nginx, Cloudflare, DNS or the firewall, touch the
# database, store secrets in Git, or deploy by the "latest" tag.
#
# DEPLOY FLOW
#   1. Read-only preflight: full SHA; repo is hpalrecha/CarCareBooker; running container
#      config is one this script can reproduce exactly (port 5000 -> 8084, restart policy,
#      mounts, network, env); candidate port 18084 is free; disk space; not near 20:00 IST.
#   2. Fetch origin, require the commit to exist (and be in origin/main).
#   3. Export the commit with `git archive` into an empty build directory. That directory
#      is the deploy working tree: clean by construction (no .env, no untracked or modified
#      files), and verified against `git ls-tree` before building.
#   4. docker build -t carcarebooker:git-<sha>, labelled with the revision.
#   5. Tag the currently running image carcarebooker:rollback-<timestamp>.
#   6. Start a candidate on 127.0.0.1:18084 with the same env/mounts/network.
#   7. Health-check the candidate (Docker HEALTHCHECK, /api/business-hours, /, its JS entry,
#      /ppf-ceramic-coating, /api/services). On failure: remove the candidate, stop.
#      Production has not been touched.
#   8. Switch: stop production, back up /app/uploads out of it, rename it
#      carcarebooker-prev-<timestamp> (kept, stopped), create the new carcarebooker with the
#      identical run config, copy uploads in, start it.
#   9. Health-check 127.0.0.1:8084, then the public URL — the public homepage must reference
#      the same JS entry file as the new container, proving traffic reaches it.
#  10. Any failure after step 8 (including an unexpected error) restores the previous
#      container automatically and re-verifies it.
#
# ROLLBACK FLOW (later, by hand)
#   rollback <carcarebooker-prev-...>: back up uploads from the current container, stop and
#   rename it carcarebooker-failed-<timestamp>, copy uploads into the previous container,
#   rename it back to carcarebooker, start, and run the same local + public health checks.
#   If that fails, the swap is reversed.
#
# KNOWN CONSTRAINTS (from the codebase, not from this script)
#   - server/index.ts starts a node-cron reminder job at 20:00 IST. A candidate running
#     alongside production at that minute would send every reminder twice, so the script
#     refuses to start a candidate or switch between 19:45 and 20:05 IST.
#   - Admin uploads are written to /app/uploads. Unless that path is a mount, they live in
#     the container layer and would be lost on replacement; the script copies them across.
#   - The switch is stop-then-start on the same host port: expect roughly 5-15 seconds of
#     502s from Nginx. Avoiding that needs an Nginx upstream change, which is out of scope.
# =============================================================================
set -Eeuo pipefail

readonly APP="carcarebooker"
readonly IMAGE_REPO="carcarebooker"
readonly APP_PORT="5000"
readonly PROD_PORT="8084"
readonly CANDIDATE_PORT="18084"
readonly EXPECTED_REMOTE="github.com/hpalrecha/CarCareBooker"
# Backups, deploy log and the lock live here. Overridable only so the script can be tested.
readonly STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
readonly TS="$(date -u +%Y%m%dT%H%M%SZ)"

REPO_DIR="/home/ubuntu/CarCareBooker"
PUBLIC_URL="https://p91carcare.com"
EXECUTE=0
ALLOW_NON_MAIN=0
ACCEPT_DIFF=0
MODE="${1:-}"
TARGET="${2:-}"

die()  { echo "ABORT: $*" >&2; exit 1; }
note() { echo "[deploy] $*"; }
warn() { echo "[deploy] WARNING: $*" >&2; }

# Mutating commands go through run(): printed in dry-run, executed with --execute.
run() {
  if [[ "$EXECUTE" == "1" ]]; then
    printf '+'; printf ' %q' "$@"; printf '\n'
    "$@"
  else
    printf '[dry-run] would run:'; printf ' %q' "$@"; printf '\n'
  fi
}

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }

[[ "$MODE" == "deploy" || "$MODE" == "rollback" ]] || usage
[[ -n "$TARGET" ]] || usage
shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE=1 ;;
    --repo) REPO_DIR="${2:?--repo needs a directory}"; shift ;;
    --public-url) PUBLIC_URL="${2:?--public-url needs a URL}"; shift ;;
    --allow-non-main) ALLOW_NON_MAIN=1 ;;
    --accept-container-diff) ACCEPT_DIFF=1 ;;
    *) die "unknown option: $1" ;;
  esac
  shift
done
PUBLIC_URL="${PUBLIC_URL%/}"
[[ "$PUBLIC_URL" =~ ^https?://[^/]+$ ]] || die "--public-url must be an origin like https://p91carcare.com"

if [[ "$EXECUTE" == "1" ]]; then note "MODE: EXECUTE — production will be changed"; else note "MODE: DRY-RUN — nothing will be changed"; fi

for bin in docker git curl flock tar python3; do command -v "$bin" >/dev/null || die "missing required command: $bin"; done
docker info >/dev/null 2>&1 || die "cannot talk to Docker (need root or the docker group)"

# git as the checkout's owner, so running under sudo never leaves root-owned objects in .git.
g() {
  local owner; owner="$(stat -c %U "$REPO_DIR")"
  if [[ "$(id -u)" == "0" && "$owner" != "root" ]]; then
    sudo -u "$owner" git -C "$REPO_DIR" "$@"
  else
    git -C "$REPO_DIR" "$@"
  fi
}

# ----------------------------------------------------------------------------- health checks
http_code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$1" || true; }

wait_docker_healthy() { # name
  local name="$1" status
  for _ in $(seq 1 50); do
    # Parsed, not templated: `{{if .State.Health}}` aborts on a Docker that omits empty fields.
    status="$(docker inspect "$name" 2>/dev/null | python3 -c '
import json, sys
doc = json.load(sys.stdin)
if isinstance(doc, list):
    doc = doc[0]
state = doc.get("State") or {}
print((state.get("Health") or {}).get("Status") or ("running" if state.get("Running") else "stopped"))
' 2>/dev/null || echo gone)"
    case "$status" in
      healthy|running) return 0 ;;
      unhealthy|gone) echo "container $name is $status" >&2; return 1 ;;
    esac
    sleep 3
  done
  echo "container $name not healthy after 150s" >&2
  return 1
}

# Prints the JS entry file the homepage references, e.g. /assets/index-Cp1Vr_J8.js
entry_asset() { curl -s -m 10 "$1/" | grep -o -m1 -E '/assets/index-[A-Za-z0-9_-]+\.js' || true; }

check_app() { # base-url  -> 0 when every check passes
  local base="$1" body entry ok=0
  body="$(curl -s -m 10 "$base/api/business-hours" || true)"
  if [[ "$body" == *dayOfWeek* ]]; then note "  ok   $base/api/business-hours"; else note "  FAIL $base/api/business-hours"; ok=1; fi
  body="$(curl -s -m 10 "$base/api/services" || true)"
  if [[ "$body" == \[*slug* ]]; then note "  ok   $base/api/services"; else note "  FAIL $base/api/services"; ok=1; fi
  for p in / /ppf-ceramic-coating /services; do
    if [[ "$(http_code "$base$p")" == "200" ]]; then note "  ok   $base$p"; else note "  FAIL $base$p"; ok=1; fi
  done
  entry="$(entry_asset "$base")"
  if [[ -n "$entry" && "$(http_code "$base$entry")" == "200" ]]; then note "  ok   $base$entry"; else note "  FAIL entry asset '${entry:-none}'"; ok=1; fi
  return "$ok"
}

check_public_matches() { # expected-entry-asset
  local expected="$1" live
  for _ in $(seq 1 10); do
    live="$(entry_asset "$PUBLIC_URL")"
    if [[ "$live" == "$expected" ]] && check_app "$PUBLIC_URL"; then
      note "public site serves $live"
      return 0
    fi
    sleep 3
  done
  echo "public site serves '${live:-nothing}', expected '$expected'" >&2
  return 1
}

# The reminder job is scheduled in Asia/Kolkata. Without that zone's data, TZ=Asia/Kolkata
# silently reads as UTC and this guard would protect the wrong hour, so the offset is proven
# first and the reading is cross-checked against UTC + 05:30 (India has no DST).
reminder_window_guard() {
  local offset ist utc ist_min utc_min drift
  offset="$(TZ=Asia/Kolkata date +%z 2>/dev/null || true)"
  [[ "$offset" == "+0530" ]] \
    || die "cannot verify Asia/Kolkata time on this host (TZ=Asia/Kolkata reports offset '${offset:-none}', expected +0530). Install tzdata; refusing rather than guessing the 20:00 IST window."
  ist="$(TZ=Asia/Kolkata date +%H%M)"
  utc="$(date -u +%H%M)"
  [[ "$ist" =~ ^[0-9]{4}$ && "$utc" =~ ^[0-9]{4}$ ]] || die "cannot read the clock (IST '$ist', UTC '$utc')"
  ist_min=$(( 10#${ist:0:2} * 60 + 10#${ist:2:2} ))
  utc_min=$(( 10#${utc:0:2} * 60 + 10#${utc:2:2} ))
  drift=$(( (ist_min - (utc_min + 330) + 2880) % 1440 ))
  (( drift <= 1 || drift >= 1439 )) \
    || die "IST clock ($ist) disagrees with UTC+05:30 (UTC $utc); refusing rather than guessing the 20:00 IST window"
  if (( ist_min >= 19 * 60 + 45 && ist_min <= 20 * 60 + 5 )); then
    die "it is $ist IST: two containers must not be alive at the 20:00 IST reminder run. Retry after 20:05 IST."
  fi
}

# ----------------------------------------------------------------------------- run config
# Reads the running container and builds the exact `docker create` arguments to reproduce
# it. Anything this script does not know how to reproduce is refused, not dropped.
declare -a RUN_ARGS=()   # network, logging and mounts, shared by candidate and production
RESTART_POLICY=""
UPLOADS_MOUNTED=0
ENV_FILE=""

# Container and image facts, read once from `docker inspect` JSON.
#
# `docker inspect --format` cannot be trusted for this. On the production host the object is a
# map whose empty fields are omitted, so `{{json .HostConfig.Tmpfs}}` aborts the whole inspect
# with `map has no entry for key "Tmpfs"`. Parsing the JSON sidesteps every such version
# difference: a field Docker omitted is simply not set, which is exactly the default required.
readonly FACTS_PY='
import json, sys

doc = json.load(sys.stdin)
if isinstance(doc, list):
    doc = doc[0]
hc = doc.get("HostConfig") or {}
cfg = doc.get("Config") or {}
out = []

# Settings that materially change runtime behaviour. A missing key = an omitted empty value.
for key in ["Privileged", "SecurityOpt", "CapAdd", "CapDrop", "Ulimits", "Tmpfs", "Sysctls",
            "Init", "Runtime", "ReadonlyRootfs", "Devices", "DeviceRequests", "ExtraHosts",
            "Links", "Dns", "DnsOptions", "DnsSearch", "VolumesFrom", "GroupAdd", "StorageOpt",
            "PidMode", "UsernsMode", "UTSMode", "IpcMode", "CgroupnsMode", "CgroupParent",
            "Isolation", "ShmSize", "Memory", "MemoryReservation", "MemorySwap", "NanoCpus",
            "CpuShares", "CpuQuota", "CpuPeriod", "CpusetCpus", "CpusetMems", "BlkioWeight",
            "PidsLimit", "OomKillDisable", "OomScoreAdj", "PublishAllPorts", "AutoRemove"]:
    out.append("SETTING %s=%s" % (key, json.dumps(hc.get(key))))
for key in ["StopTimeout", "Domainname", "Tty", "OpenStdin"]:
    out.append("SETTING %s=%s" % (key, json.dumps(cfg.get(key))))
out.append("SETTING Networks=%d" % len((doc.get("NetworkSettings") or {}).get("Networks") or {}))
hostname = cfg.get("Hostname") or ""
out.append("SETTING CustomHostname=%s" % ("false" if hostname == (doc.get("Id") or "")[:12] else "true"))

# Inherited from the image: these must still equal the image own values. Empty and absent mean
# the same thing (Docker omits empty fields on some versions), so both normalise to null —
# otherwise an omitted User reads as "overridden" against an image that reports "".
def norm(value):
    return None if value in (None, "", [], {}) else value

for key in ["Cmd", "Entrypoint", "WorkingDir", "User", "Healthcheck", "StopSignal", "Labels",
            "ExposedPorts", "Volumes"]:
    out.append("INHERITED %s=%s" % (key, json.dumps(norm(cfg.get(key)))))

log = hc.get("LogConfig") or {}
out.append("LOGDRIVER %s" % (log.get("Type") or ""))
out.append("LOGOPTCOUNT %d" % len(log.get("Config") or {}))
for key, value in sorted((log.get("Config") or {}).items()):
    # A newline would split into a line this script cannot map back to its option.
    if "\n" in key or "\n" in str(value):
        out.append("UNSAFE log option %s contains a newline" % key)
    else:
        out.append("LOGOPT %s=%s" % (key, value))

for port, binds in sorted((hc.get("PortBindings") or {}).items()):
    for bind in binds or []:
        out.append("PORT %s %s %s" % (port, bind.get("HostIp") or "", bind.get("HostPort") or ""))

for mount in doc.get("Mounts") or []:
    source = mount.get("Name") if mount.get("Type") == "volume" else mount.get("Source")
    out.append("MOUNT %s|%s|%s|%s" % (mount.get("Type") or "", source or "",
                                      mount.get("Destination") or "",
                                      "true" if mount.get("RW") else "false"))

env = cfg.get("Env") or []
out.append("ENVCOUNT %d" % len(env))
for entry in env:
    if "\n" in entry:
        out.append("UNSAFE environment variable %s contains a newline" % entry.split("=")[0])
    else:
        out.append("ENV %s" % entry)

out.append("RESTART %s" % ((hc.get("RestartPolicy") or {}).get("Name") or "no"))
out.append("NETWORKMODE %s" % (hc.get("NetworkMode") or ""))
out.append("IMAGEID %s" % (doc.get("Image") or ""))
out.append("IMAGEREF %s" % (cfg.get("Image") or ""))
out.append("CONTAINERID %s" % (doc.get("Id") or ""))
print("\n".join(out))
'

readonly IMAGE_FACTS_PY='
import json, sys

doc = json.load(sys.stdin)
if isinstance(doc, list):
    doc = doc[0]
cfg = doc.get("Config") or {}
out = []
def norm(value):
    return None if value in (None, "", [], {}) else value

for key in ["Cmd", "Entrypoint", "WorkingDir", "User", "Healthcheck", "StopSignal", "Labels",
            "ExposedPorts", "Volumes"]:
    out.append("INHERITED %s=%s" % (key, json.dumps(norm(cfg.get(key)))))
for entry in cfg.get("Env") or []:
    out.append("ENV %s" % entry)
out.append("REVISION %s" % ((cfg.get("Labels") or {}).get("org.opencontainers.image.revision") or ""))
print("\n".join(out))
'

FACTS=""   # facts of the container capture_run_config last read

load_facts() { # container
  FACTS="$(docker inspect "$1" | python3 -c "$FACTS_PY")" \
    || die "could not inspect $1; refusing to guess its configuration"
  [[ -n "$FACTS" ]] || die "docker inspect returned nothing for $1"
}
image_facts() { # image -> INHERITED/ENV/REVISION lines
  docker image inspect "$1" | python3 -c "$IMAGE_FACTS_PY" \
    || die "could not inspect image $1; refusing to guess"
}
image_revision() { image_facts "$1" | sed -n 's/^REVISION //p'; }
# One "KIND value" line per fact; `fact KIND` prints the values of that kind.
fact()  { sed -n "s/^$1 //p" <<<"$FACTS"; }
fact1() { fact "$1" | head -1; }

unsupported_settings() { # -> names of settings that are not at their Docker default (reads $FACTS)
  local image name value line bad="" inherited_image
  image="$(fact1 IMAGEID)"
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    name="${line%%=*}"; value="${line#*=}"
    # "null" everywhere: Docker omits empty values, and an omitted value IS the default.
    case "$name" in
      SecurityOpt|CapAdd|CapDrop|Ulimits|Tmpfs|Sysctls|Devices|DeviceRequests|ExtraHosts|Links|Dns|DnsOptions|DnsSearch|VolumesFrom|GroupAdd|StorageOpt)
        [[ "$value" == "null" || "$value" == "[]" || "$value" == "{}" ]] || bad+="$name=$value " ;;
      Privileged|ReadonlyRootfs|PublishAllPorts|AutoRemove|Tty|OpenStdin|CustomHostname|Init|OomKillDisable)
        [[ "$value" == "false" || "$value" == "null" ]] || bad+="$name=$value " ;;
      Runtime)
        [[ "$value" == '"runc"' || "$value" == '""' || "$value" == "null" ]] || bad+="$name=$value " ;;
      PidMode|UsernsMode|UTSMode|CgroupParent|CpusetCpus|CpusetMems|Domainname)
        [[ "$value" == '""' || "$value" == "null" ]] || bad+="$name=$value " ;;
      IpcMode)
        [[ "$value" == '"private"' || "$value" == '"shareable"' || "$value" == '""' || "$value" == "null" ]] || bad+="$name=$value " ;;
      CgroupnsMode)
        [[ "$value" == '"private"' || "$value" == '"host"' || "$value" == '""' || "$value" == "null" ]] || bad+="$name=$value " ;;
      Isolation)
        [[ "$value" == '""' || "$value" == '"default"' || "$value" == "null" ]] || bad+="$name=$value " ;;
      ShmSize)
        [[ "$value" == "0" || "$value" == "67108864" || "$value" == "null" ]] || bad+="$name=$value " ;;
      Memory|MemoryReservation|MemorySwap|NanoCpus|CpuShares|CpuQuota|CpuPeriod|BlkioWeight|OomScoreAdj|PidsLimit|StopTimeout)
        [[ "$value" == "0" || "$value" == "null" ]] || bad+="$name=$value " ;;
      Networks)
        [[ "$value" == "1" ]] || bad+="attached-networks=$value " ;;
      *) bad+="unrecognised-setting:$name " ;;
    esac
  done < <(fact SETTING)

  inherited_image="$(image_facts "$image" | sed -n 's/^INHERITED //p')"
  while IFS= read -r name; do
    [[ -n "$name" ]] && bad+="$name-overridden "
  done < <(diff <(fact INHERITED) <(echo "$inherited_image") | sed -n 's/^< \([A-Za-z]*\)=.*/\1/p')
  printf '%s' "$bad"
}

capture_run_config() { # container, then "deploy" (refuse anything unreproducible) or "rollback" (warn only)
  local c="$1" purpose="$2" image bindings unsupported mounts line restart network log_driver log_opts type src dst rw
  load_facts "$c"
  # Values the facts reader could not represent safely (a newline in an env value or log option).
  [[ -z "$(fact UNSAFE)" ]] || die "cannot reproduce $c safely: $(fact UNSAFE | tr '\n' '; ')"
  image="$(fact1 IMAGEID)"

  bindings="$(fact PORT)"
  PROD_HOST_IP="$(awk '{ if (NF==3) print $2; else print "" }' <<<"$bindings")"
  [[ "$(grep -c . <<<"$bindings" || true)" == "1" && "$bindings" == "$APP_PORT/tcp "*" $PROD_PORT" ]] \
    || die "unexpected port bindings on $c (need exactly $APP_PORT/tcp -> $PROD_PORT):"$'\n'"${bindings:-none}"

  # `|| die`: a failure to READ the settings must stop the script, never look like "none found".
  unsupported="$(unsupported_settings)" || die "could not verify the settings of $c; refusing before touching production"
  if [[ -n "$unsupported" ]]; then
    # A rollback restarts an existing container with its settings intact, so it only warns.
    [[ "$purpose" == "rollback" ]] || die "$c uses settings this script cannot reproduce: $unsupported— refusing before touching production"
    warn "$c has non-default settings (a rollback keeps them, a deploy would refuse): $unsupported"
  fi

  restart="$(fact1 RESTART)"
  RESTART_POLICY="${restart:-no}"
  RUN_ARGS=()
  network="$(fact1 NETWORKMODE)"
  [[ "$network" == "default" || "$network" == "bridge" || -z "$network" ]] || RUN_ARGS+=(--network "$network")

  # Logging is reproduced exactly (driver and every option, e.g. max-size), never defaulted.
  log_driver="$(fact1 LOGDRIVER)"
  [[ -n "$log_driver" ]] || die "could not read the log driver of $c; refusing to guess"
  RUN_ARGS+=(--log-driver "$log_driver")
  log_opts="$(fact LOGOPT)"
  [[ "$(grep -c . <<<"$log_opts" || true)" == "$(fact1 LOGOPTCOUNT)" ]] \
    || die "a log option on $c contains a newline; cannot reproduce it safely"
  while IFS= read -r line; do
    [[ -n "$line" ]] && RUN_ARGS+=(--log-opt "$line")
  done <<<"$log_opts"

  mounts="$(fact MOUNT)"
  while IFS='|' read -r type src dst rw; do
    [[ -z "$type" ]] && continue
    [[ "$type" == "bind" || "$type" == "volume" ]] || die "unsupported mount type $type at $dst"
    [[ "$src$dst" != *:* ]] || die "mount path contains ':' ($src -> $dst)"
    if [[ "$rw" == "true" ]]; then RUN_ARGS+=(-v "$src:$dst"); else RUN_ARGS+=(-v "$src:$dst:ro"); fi
    [[ "$dst" == "/app/uploads" ]] && UPLOADS_MOUNTED=1
  done <<<"$mounts"

  note "running config of $c:"
  note "  image $image | restart=$restart | network=${network:-default} | port ${PROD_HOST_IP:-0.0.0.0}:$PROD_PORT->$APP_PORT"
  note "  logging: $log_driver ${log_opts:+($(tr '\n' ' ' <<<"$log_opts"))}"
  note "  mounts: ${mounts:-none}"
  note "  env vars set on the container (names only): $(env_names | tr '\n' ' ')"
}

# Container env minus the image's own defaults = what was passed at `docker run`.
container_env() { # reads $FACTS
  local image
  image="$(fact1 IMAGEID)"
  [[ "$(fact ENV | grep -c . || true)" == "$(fact1 ENVCOUNT)" ]] \
    || die "an environment value contains a newline; cannot reproduce it safely"
  comm -23 <(fact ENV | sort) <(image_facts "$image" | sed -n 's/^ENV //p' | sort)
}
env_names() { container_env | cut -d= -f1; }

write_env_file() { # container -> ENV_FILE (0600, outside Git, deleted on exit)
  if [[ "$EXECUTE" != "1" ]]; then ENV_FILE="$STATE_DIR/run/env-$TS"; note "[dry-run] would copy the container env into $ENV_FILE (mode 600)"; return; fi
  install -d -m 700 "$STATE_DIR/run"
  ENV_FILE="$STATE_DIR/run/env-$TS"
  ( umask 077; container_env > "$ENV_FILE" )
}

container_writes() { # container -> changed paths outside uploads/tmp/npm cache
  # `docker diff` also reports every parent directory of a change ("C /app" for a new file in
  # /app/uploads). Entries that are only ancestors of other entries are dropped first.
  docker diff "$1" | awk '{print $2}' | LC_ALL=C sort -u \
    | awk '{ p[NR] = $0 }
           END { for (i = 1; i <= NR; i++) { anc = 0
                   for (j = 1; j <= NR; j++) if (j != i && index(p[j], p[i] "/") == 1) { anc = 1; break }
                   if (!anc) print p[i] } }' \
    | grep -v -E '^/(app/uploads|tmp|root/\.npm|root/\.cache)(/|$)' || true
}

backup_uploads() { # container dest-dir
  [[ "$UPLOADS_MOUNTED" == "1" ]] && { note "/app/uploads is a mount; nothing to copy"; return; }
  run install -d -m 700 "$2"
  run docker cp "$1:/app/uploads" "$2/"
}

restore_uploads() { # backup-dir container
  [[ "$UPLOADS_MOUNTED" == "1" ]] && return
  # A missing backup is a failure, not a skip: carrying on would silently drop every upload.
  [[ "$EXECUTE" != "1" || -d "$1/uploads" ]] || die "uploads backup $1/uploads is missing"
  run docker cp "$1/uploads/." "$2:/app/uploads/"
}

log_event() { [[ "$EXECUTE" == "1" ]] && { install -d -m 700 "$STATE_DIR"; echo "$(date -u +%FT%TZ) $*" >> "$STATE_DIR/deploys.log"; }; return 0; }

# ----------------------------------------------------------------------------- common preflight
if [[ "$EXECUTE" == "1" ]]; then
  install -d -m 700 "$STATE_DIR"
  exec 9>"$STATE_DIR/lock"
  flock -n 9 || die "another deploy or rollback is running"
fi

docker inspect "$APP" >/dev/null 2>&1 || die "no container named $APP"

# ============================================================================= rollback
if [[ "$MODE" == "rollback" ]]; then
  PREV="$TARGET"
  [[ "$PREV" =~ ^carcarebooker-prev-[0-9TZ]+$ ]] || die "rollback target must be a carcarebooker-prev-<timestamp> container"
  docker inspect "$PREV" >/dev/null 2>&1 || die "no container named $PREV"
  [[ "$(docker inspect -f '{{.State.Running}}' "$PREV")" == "false" ]] || die "$PREV is running; refusing"
  reminder_window_guard
  capture_run_config "$APP" rollback
  FAILED="carcarebooker-failed-$TS"
  BACKUP="$STATE_DIR/backups/$TS"
  # Container IDs survive renames, so the undo below can never mistake one for the other.
  CUR_ID="$(docker inspect -f '{{.Id}}' "$APP")"
  PREV_ID="$(docker inspect -f '{{.Id}}' "$PREV")"
  ROLLBACK_STARTED=0
  ROLLBACK_OK=0
  name_of() { docker inspect -f '{{.Name}}' "$1" 2>/dev/null | sed 's#^/##'; }
  undo_rollback() {
    set +e
    warn "reversing the rollback: restarting the container that was running before this command"
    docker stop -t 20 "$PREV_ID" >/dev/null 2>&1
    [[ "$(name_of "$PREV_ID")" == "$APP" ]] && docker rename "$PREV_ID" "$PREV"
    [[ "$(name_of "$CUR_ID")" == "$APP" ]] || docker rename "$CUR_ID" "$APP"
    docker start "$CUR_ID"
    if wait_docker_healthy "$APP" && check_app "http://127.0.0.1:$PROD_PORT"; then
      log_event "ROLLBACK to $PREV failed; reversed, original container running and healthy locally"
    else
      log_event "ROLLBACK to $PREV failed; REVERSAL ALSO FAILED"
      warn "REVERSAL FAILED. Intervene now: containers $CUR_ID and $PREV_ID are both kept."
    fi
  }
  rollback_exit() { local code=$?; if [[ "$ROLLBACK_STARTED" == "1" && "$ROLLBACK_OK" != "1" ]]; then undo_rollback; fi; exit "$code"; }
  trap rollback_exit EXIT

  note "rollback plan: $APP -> $FAILED (stopped, kept); $PREV -> $APP; uploads carried across"
  note "  current image $(docker inspect -f '{{.Config.Image}}' "$APP"), restoring image $(docker inspect -f '{{.Config.Image}}' "$PREV")"
  [[ "$EXECUTE" == "1" ]] && ROLLBACK_STARTED=1
  run docker stop -t 20 "$APP"
  backup_uploads "$APP" "$BACKUP"
  run docker rename "$APP" "$FAILED"
  restore_uploads "$BACKUP" "$PREV"
  run docker rename "$PREV" "$APP"
  run docker start "$APP"
  if [[ "$EXECUTE" != "1" ]]; then note "[dry-run] would then verify 127.0.0.1:$PROD_PORT and $PUBLIC_URL, and undo the swap on failure"; exit 0; fi
  wait_docker_healthy "$APP" || die "restored container is not healthy"
  check_app "http://127.0.0.1:$PROD_PORT" || die "restored container failed local checks"
  check_public_matches "$(entry_asset "http://127.0.0.1:$PROD_PORT")" || die "$PUBLIC_URL is not serving the restored container"
  ROLLBACK_OK=1
  log_event "ROLLBACK ok: $PREV restored as $APP; $FAILED kept"
  note "ROLLBACK COMPLETE. The replaced container is kept as $FAILED."
  exit 0
fi

# ============================================================================= deploy
SHA="$TARGET"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "deploy needs the full 40-character commit SHA, not '$SHA'"
SHORT="${SHA:0:12}"
IMAGE="$IMAGE_REPO:git-$SHA"
CANDIDATE="$APP-candidate-$SHORT"
PREV="$APP-prev-$TS"
BUILD_DIR="$STATE_DIR/build/$SHA"
BACKUP="$STATE_DIR/backups/$TS"
SWITCHED=0
DEPLOY_OK=0
CREATED_CANDIDATE=0

# 1. Preflight (read-only) ----------------------------------------------------
[[ -d "$REPO_DIR/.git" ]] || die "$REPO_DIR is not a Git checkout (use --repo)"
[[ "$(g remote get-url origin)" == *"$EXPECTED_REMOTE"* ]] || die "$REPO_DIR origin is not $EXPECTED_REMOTE"
note "server checkout: $(g rev-parse --short HEAD) on $(g rev-parse --abbrev-ref HEAD); status: $(g status --porcelain | wc -l) changed file(s) (not used for the build)"

[[ "$(docker inspect -f '{{.State.Running}}' "$APP")" == "true" ]] || die "$APP is not running; this script replaces a running container only"
OLD_IMAGE_ID="$(docker inspect -f '{{.Image}}' "$APP")"
OLD_CONTAINER_ID="$(docker inspect -f '{{.Id}}' "$APP")"
note "current: $APP image $(docker inspect -f '{{.Config.Image}}' "$APP") ($OLD_IMAGE_ID), revision label: $(image_revision "$OLD_IMAGE_ID" || true)"
capture_run_config "$APP" deploy

WRITES="$(container_writes "$APP")"
if [[ -n "$WRITES" ]]; then
  warn "$APP has files written outside /app/uploads that a new container will NOT have:"
  echo "$WRITES" | head -40 >&2
  [[ "$ACCEPT_DIFF" == "1" || "$EXECUTE" != "1" ]] || die "review the list above, then rerun with --accept-container-diff"
fi
[[ "$UPLOADS_MOUNTED" == "1" ]] || note "/app/uploads is NOT a mount: $(docker diff "$APP" | awk '$2 ~ "^/app/uploads/" {n++} END {print n+0}') uploaded path(s) will be copied across"

docker inspect "$CANDIDATE" >/dev/null 2>&1 && die "a container named $CANDIDATE already exists"
if curl -s -o /dev/null -m 3 "http://127.0.0.1:$CANDIDATE_PORT/"; then die "port $CANDIDATE_PORT is already in use"; fi
FREE_GB="$(df -P --block-size=1G "$(docker info -f '{{.DockerRootDir}}')" | awk 'NR==2 {print $4}')"
(( FREE_GB >= 5 )) || die "only ${FREE_GB}G free under Docker's root; the build needs roughly 5G"
note "disk free under Docker root: ${FREE_GB}G"
reminder_window_guard

# Automatic restore for any failure once production has been stopped.
restore_previous() {
  set +e
  warn "restoring the previous production container"
  # Work by container ID: whatever currently holds the name "$APP" is removed only if it is
  # NOT the old production container, which is renamed back and started.
  local holder
  holder="$(docker inspect -f '{{.Id}}' "$APP" 2>/dev/null)"
  if [[ -n "$holder" && "$holder" != "$OLD_CONTAINER_ID" ]]; then docker rm -f "$holder" >/dev/null 2>&1; fi
  [[ "$holder" == "$OLD_CONTAINER_ID" ]] || docker rename "$OLD_CONTAINER_ID" "$APP"
  docker start "$OLD_CONTAINER_ID"
  if wait_docker_healthy "$APP" && check_app "http://127.0.0.1:$PROD_PORT"; then
    log_event "DEPLOY $SHA failed after switch; previous container restored"
    warn "PREVIOUS CONTAINER RESTORED and healthy locally. Check $PUBLIC_URL by hand."
  else
    log_event "DEPLOY $SHA failed after switch; RESTORE ALSO FAILED"
    warn "RESTORE FAILED. Previous image is tagged $IMAGE_REPO:rollback-$TS. Intervene now."
  fi
}
on_exit() {
  local code=$?
  set +e
  if [[ "$CREATED_CANDIDATE" == "1" ]]; then docker rm -f "$CANDIDATE" >/dev/null 2>&1; fi
  if [[ "$SWITCHED" == "1" && "$DEPLOY_OK" != "1" ]]; then restore_previous; fi
  [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]] && rm -f "$ENV_FILE"
  [[ "$EXECUTE" == "1" && -d "$BUILD_DIR" ]] && rm -rf "$BUILD_DIR"
  exit "$code"
}
trap on_exit EXIT

# 2. The commit ----------------------------------------------------------------
if [[ "$EXECUTE" == "1" ]]; then
  run g fetch --no-tags origin main
else
  note "[dry-run] would run: git fetch --no-tags origin main"
fi
if g cat-file -e "$SHA^{commit}" 2>/dev/null; then
  note "commit $SHORT exists: $(g log -1 --format='%ad %s' --date=short "$SHA")"
  if g merge-base --is-ancestor "$SHA" origin/main 2>/dev/null; then
    note "commit $SHORT is contained in origin/main"
  elif [[ "$ALLOW_NON_MAIN" == "1" ]]; then
    warn "commit $SHORT is NOT in origin/main (allowed by --allow-non-main)"
  else
    die "commit $SHORT is not in origin/main; pass --allow-non-main to deploy it anyway"
  fi
elif [[ "$EXECUTE" == "1" ]]; then
  die "commit $SHA does not exist in $REPO_DIR after fetching origin"
else
  warn "commit $SHORT is not in the local checkout yet; --execute fetches origin first and re-checks"
fi

# 3-4. Clean build tree (exact export of the commit), then the image pinned to the SHA ---
if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  [[ "$(image_revision "$IMAGE")" == "$SHA" ]] \
    || die "$IMAGE exists but its revision label is not $SHA"
  note "image $IMAGE already built; reusing it"
else
  if [[ "$EXECUTE" == "1" ]]; then
    rm -rf "$BUILD_DIR"; install -d -m 700 "$BUILD_DIR"
    g archive --format=tar "$SHA" | tar -x -C "$BUILD_DIR"
    TREE_DIFF="$(diff <(g -c core.quotepath=off ls-tree -r --name-only "$SHA" | sort) \
                      <(cd "$BUILD_DIR" && find . \( -type f -o -type l \) | sed 's#^\./##' | sort) || true)"
    [[ -z "$TREE_DIFF" ]] || die "build tree does not match commit $SHORT:"$'\n'"$(head -20 <<<"$TREE_DIFF")"
    [[ ! -e "$BUILD_DIR/.env" ]] || die ".env found in the build tree"
    note "build tree $BUILD_DIR matches commit $SHORT file-for-file ($(g ls-tree -r --name-only "$SHA" | wc -l) files)"
  else
    note "[dry-run] would export: git archive $SHA | tar -x -C $BUILD_DIR, then compare it file-for-file with git ls-tree"
  fi
  run docker build \
    --label "org.opencontainers.image.revision=$SHA" \
    --label "org.opencontainers.image.source=https://$EXPECTED_REMOTE" \
    --label "p91.deploy.built-at=$TS" \
    -t "$IMAGE" "$BUILD_DIR"
fi

# 5. Rollback reference for the running image ------------------------------------
run docker tag "$OLD_IMAGE_ID" "$IMAGE_REPO:rollback-$TS"

# 6-7. Candidate on 127.0.0.1:18084 ------------------------------------------------
write_env_file "$APP"
reminder_window_guard
run docker create --name "$CANDIDATE" --restart no \
  -p "127.0.0.1:$CANDIDATE_PORT:$APP_PORT" --env-file "$ENV_FILE" "${RUN_ARGS[@]}" "$IMAGE"
[[ "$EXECUTE" == "1" ]] && CREATED_CANDIDATE=1
run docker start "$CANDIDATE"
if [[ "$EXECUTE" == "1" ]]; then
  note "checking candidate on 127.0.0.1:$CANDIDATE_PORT"
  if ! wait_docker_healthy "$CANDIDATE" || ! check_app "http://127.0.0.1:$CANDIDATE_PORT"; then
    docker logs --tail 80 "$CANDIDATE" >&2 || true
    die "candidate failed its health checks; it has been removed and production was NOT touched"
  fi
  NEW_ENTRY="$(entry_asset "http://127.0.0.1:$CANDIDATE_PORT")"
  note "candidate healthy, serving $NEW_ENTRY"
else
  note "[dry-run] would wait for Docker health, then check /api/business-hours, /api/services, /, /ppf-ceramic-coating, /services and the JS entry on 127.0.0.1:$CANDIDATE_PORT"
fi
run docker rm -f "$CANDIDATE"
CREATED_CANDIDATE=0

# 8. Switch ----------------------------------------------------------------------
reminder_window_guard
run docker stop -t 20 "$APP"
[[ "$EXECUTE" == "1" ]] && SWITCHED=1
backup_uploads "$APP" "$BACKUP"
run docker rename "$APP" "$PREV"
run docker create --name "$APP" --restart "$RESTART_POLICY" "${RUN_ARGS[@]}" \
  -p "${PROD_HOST_IP:+$PROD_HOST_IP:}$PROD_PORT:$APP_PORT" --env-file "$ENV_FILE" "$IMAGE"
restore_uploads "$BACKUP" "$APP"
run docker start "$APP"

# 9. Verify locally, then publicly -------------------------------------------------
if [[ "$EXECUTE" != "1" ]]; then
  note "[dry-run] would verify 127.0.0.1:$PROD_PORT, then require $PUBLIC_URL to serve the candidate's JS entry file"
  note "[dry-run] on any failure: remove the new $APP, rename $PREV back to $APP, start it, re-verify"
  note "DRY-RUN COMPLETE. Nothing was changed."
  exit 0
fi
wait_docker_healthy "$APP" || die "new $APP did not become healthy"
check_app "http://127.0.0.1:$PROD_PORT" || die "new $APP failed local checks"
[[ "$(entry_asset "http://127.0.0.1:$PROD_PORT")" == "$NEW_ENTRY" ]] || die "port $PROD_PORT is not serving the new build"
check_public_matches "$NEW_ENTRY" || die "$PUBLIC_URL is not serving the new build"

DEPLOY_OK=1
log_event "DEPLOY ok: $SHA as $IMAGE; previous container $PREV (stopped), previous image $IMAGE_REPO:rollback-$TS"
note "DEPLOYED $SHA"
note "  image:     $IMAGE"
note "  previous:  container $PREV (stopped, kept) / image $IMAGE_REPO:rollback-$TS"
note "  roll back: $0 rollback $PREV --execute"
