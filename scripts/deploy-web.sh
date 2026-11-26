#!/usr/bin/env bash
# =============================================================================
# Deploy the new site (apps/web, Next.js) on the Lightsail host. Plan 3 Task 6.
#
# DRY-RUN BY DEFAULT. Without --execute this script only reads: it prints every command it WOULD
# run. Nothing is pulled, started, stopped or renamed.
#
#   GHCR image -> carcarebooker-web -> 127.0.0.1:8085 -> nginx (location /)
#
# Usage (on the Lightsail host, from the repo checkout deploy-manual.sh uses):
#   sudo bash scripts/deploy-web.sh [--sha <40-char sha>] [--execute] [--repo DIR]
#
#   --sha SHA     The commit whose web image to run. Default: the newest commit on origin/main that
#                 touched what the web image is built from (the paths that trigger
#                 .github/workflows/build-web-image.yml), i.e. the newest commit that HAS a web image.
#   --execute     Actually do it.
#   --repo DIR    Git checkout on the host (default /home/ubuntu/CarCareBooker).
#
# FLOW
#   1. Preflight (read-only): full SHA, commit in origin/main, not 19:45-20:15 IST, port 18085 free,
#      no leftover candidate container.
#   2. Pull ghcr.io/hpalrecha/carcarebooker-web:<sha> with the same credentials file and private Docker
#      config as deploy-manual.sh ($STATE_DIR/ghcr.env, root, mode 600); require its revision label to
#      equal the SHA; tag it carcarebooker-web:git-<sha>. Not published yet -> exit 75, nothing changed.
#   3. Candidate carcarebooker-web-candidate on 127.0.0.1:18085 (--restart no). Checks: / has a <title>
#      containing "P91", /services/paint-protection-film answers 200, /sitemap.xml lists
#      /services/paint-protection-film. On failure the candidate is removed; production is untouched.
#   4. Switch: the running carcarebooker-web (if any) is stopped and kept as carcarebooker-web-previous
#      (an older -previous is removed first); a new carcarebooker-web starts from the same image on
#      127.0.0.1:8085 with --restart unless-stopped; the same checks run against it.
#   5. Any failure after the switch removes the new container and restarts the previous one.
#
# The web container needs NO env file and NO volumes: the image carries API_ORIGIN=https://p91carcare.com
# (baked at build, apps/web/Dockerfile), which pages use at build time and for their 5-minute ISR
# refreshes at runtime (GET only, through Cloudflare and nginx to the API container).
#
# What it never does: touch the API container (carcarebooker, 8084), nginx, Cloudflare, DNS, the
# database, or deploy by a moving tag.
# =============================================================================
set -Eeuo pipefail

readonly APP="carcarebooker-web"
readonly CANDIDATE="carcarebooker-web-candidate"
readonly PREVIOUS="carcarebooker-web-previous"
readonly IMAGE_REPO="carcarebooker-web"
readonly APP_PORT="3000"
readonly PROD_PORT="8085"
readonly CANDIDATE_PORT="18085"
readonly EXPECTED_REMOTE="github.com/hpalrecha/CarCareBooker"
readonly STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
readonly GHCR_IMAGE="${P91_GHCR_WEB_IMAGE:-ghcr.io/hpalrecha/carcarebooker-web}"
readonly REGISTRY_ENV="$STATE_DIR/ghcr.env"
readonly DOCKER_CFG="$STATE_DIR/docker-config"
readonly EXIT_NOT_READY=75
# Paths the web image is built from (keep in step with build-web-image.yml `paths:`).
readonly WEB_PATHS=(apps/web packages/content packages/domain package-lock.json .github/workflows/build-web-image.yml)

REPO_DIR="/home/ubuntu/CarCareBooker"
EXECUTE=0
SHA=""

die()  { echo "ABORT: $*" >&2; exit 1; }
note() { echo "[deploy-web] $*"; }
warn() { echo "[deploy-web] WARNING: $*" >&2; }

# Mutating commands go through run(): printed in dry-run, executed with --execute.
run() {
  if [[ "$EXECUTE" == "1" ]]; then
    printf '+'; printf ' %q' "$@"; printf '\n'
    "$@"
  else
    printf '[dry-run] would run:'; printf ' %q' "$@"; printf '\n'
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE=1 ;;
    --sha) SHA="${2:?--sha needs a 40-character commit SHA}"; shift ;;
    --repo) REPO_DIR="${2:?--repo needs a directory}"; shift ;;
    -h|--help) sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
  shift
done
[[ -z "$SHA" || "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "--sha needs the full 40-character commit SHA, not '$SHA'"

if [[ "$EXECUTE" == "1" ]]; then note "MODE: EXECUTE — the web container will be replaced"; else note "MODE: DRY-RUN — nothing will be changed"; fi

for bin in docker git curl flock date; do command -v "$bin" >/dev/null || die "missing required command: $bin"; done
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

# Same proof-then-check as deploy-manual.sh, with a wider window (19:45-20:15 IST): the API's
# 20:00 IST reminder run is the host's busiest minute, and the cutover must not compete with it.
reminder_window_guard() {
  local offset ist utc ist_min utc_min drift
  offset="$(TZ=Asia/Kolkata date +%z 2>/dev/null || true)"
  [[ "$offset" == "+0530" ]] \
    || die "cannot verify Asia/Kolkata time on this host (offset '${offset:-none}', expected +0530). Install tzdata."
  ist="$(TZ=Asia/Kolkata date +%H%M)"
  utc="$(date -u +%H%M)"
  [[ "$ist" =~ ^[0-9]{4}$ && "$utc" =~ ^[0-9]{4}$ ]] || die "cannot read the clock (IST '$ist', UTC '$utc')"
  ist_min=$(( 10#${ist:0:2} * 60 + 10#${ist:2:2} ))
  utc_min=$(( 10#${utc:0:2} * 60 + 10#${utc:2:2} ))
  drift=$(( (ist_min - (utc_min + 330) + 2880) % 1440 ))
  (( drift <= 1 || drift >= 1439 )) || die "IST clock ($ist) disagrees with UTC+05:30 (UTC $utc)"
  if (( ist_min >= 19 * 60 + 45 && ist_min <= 20 * 60 + 15 )); then
    echo "ABORT: it is $ist IST, inside 19:45-20:15 IST (the API's 20:00 reminder run). Retry after 20:15 IST." >&2
    exit "$EXIT_NOT_READY"
  fi
}

exists() { docker inspect "$1" >/dev/null 2>&1; }
port_busy() { curl -s -o /dev/null -m 3 "http://127.0.0.1:$1/"; }

# The three checks, against a base URL. Retries for up to ~60 s while the server starts.
check_web() { # base-url -> 0 when every check passes
  local base="$1" body ok code
  for _ in $(seq 1 20); do
    curl -s -o /dev/null -m 5 "$base/" && break
    sleep 3
  done
  ok=0
  body="$(curl -s -m 10 "$base/" || true)"
  if grep -Eq '<title>[^<]*P91[^<]*</title>' <<<"$body"; then note "  ok   $base/ title: $(grep -oE '<title>[^<]*' <<<"$body" | head -1 | sed 's/<title>//')"; else note "  FAIL $base/ has no <title> containing P91"; ok=1; fi
  code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$base/services/paint-protection-film" || true)"
  if [[ "$code" == "200" ]]; then note "  ok   $base/services/paint-protection-film"; else note "  FAIL $base/services/paint-protection-film -> $code"; ok=1; fi
  body="$(curl -s -m 10 "$base/sitemap.xml" || true)"
  if [[ "$body" == *"/services/paint-protection-film<"* ]]; then note "  ok   $base/sitemap.xml lists /services/paint-protection-film"; else note "  FAIL $base/sitemap.xml does not list /services/paint-protection-film"; ok=1; fi
  return "$ok"
}

# ----------------------------------------------------------------------------- preflight
if [[ "$EXECUTE" == "1" ]]; then
  install -d -m 700 "$STATE_DIR"
  exec 9>"$STATE_DIR/web.lock"
  flock -n 9 || die "another web deploy is running"
fi

[[ -d "$REPO_DIR/.git" ]] || die "$REPO_DIR is not a Git checkout (use --repo)"
[[ "$(g remote get-url origin)" == *"$EXPECTED_REMOTE"* ]] || die "$REPO_DIR origin is not $EXPECTED_REMOTE"
# Fetching only updates remote-tracking refs; it never changes the checkout or a running container.
g fetch --quiet --no-tags origin main || die "git fetch failed"
if [[ -z "$SHA" ]]; then
  SHA="$(g log -1 --format=%H origin/main -- "${WEB_PATHS[@]}")"
  [[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "could not find a commit on origin/main that touches the web app"
  note "no --sha given: newest origin/main commit with a web image is ${SHA:0:12} ($(g log -1 --format='%ad %s' --date=short "$SHA"))"
fi
g cat-file -e "$SHA^{commit}" 2>/dev/null || die "commit $SHA does not exist in $REPO_DIR after fetching origin"
g merge-base --is-ancestor "$SHA" origin/main || die "commit ${SHA:0:12} is not in origin/main"
IMAGE="$IMAGE_REPO:git-$SHA"

reminder_window_guard
exists "$CANDIDATE" && die "a container named $CANDIDATE already exists (remove it: docker rm -f $CANDIDATE)"
port_busy "$CANDIDATE_PORT" && die "port $CANDIDATE_PORT is already in use"
if exists "$APP"; then
  note "current: $APP image $(docker inspect -f '{{.Config.Image}}' "$APP"), running=$(docker inspect -f '{{.State.Running}}' "$APP")"
else
  note "no $APP container yet (first deploy)"
  port_busy "$PROD_PORT" && die "port $PROD_PORT is in use by something that is not $APP"
fi

# ----------------------------------------------------------------------------- image
GHCR_USER=""; GHCR_TOKEN=""
read_ghcr_creds() {
  [[ -f "$REGISTRY_ENV" ]] || return 0
  local perm owner line
  perm="$(stat -c '%a' "$REGISTRY_ENV")"; owner="$(stat -c '%u' "$REGISTRY_ENV")"
  [[ "$owner" == "0" && "$perm" =~ ^[0-6]00$ ]] \
    || die "$REGISTRY_ENV must be owned by root with mode 600 (found owner $owner, mode $perm)"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    case "$line" in
      GHCR_USER=*) GHCR_USER="${line#GHCR_USER=}" ;;
      GHCR_TOKEN=*) GHCR_TOKEN="${line#GHCR_TOKEN=}" ;;
    esac
  done <"$REGISTRY_ENV"
}
image_revision() { docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$1" 2>/dev/null || true; }

pull_image() {
  local ref="$GHCR_IMAGE:$SHA" out rev
  read_ghcr_creds
  if [[ "$EXECUTE" != "1" ]]; then
    note "[dry-run] would pull $ref (login from $REGISTRY_ENV: ${GHCR_USER:-none, anonymous pull}), require revision $SHA, tag it $IMAGE"
    return 0
  fi
  install -d -m 700 "$DOCKER_CFG"
  if [[ -n "$GHCR_TOKEN" ]]; then
    printf '%s' "$GHCR_TOKEN" | DOCKER_CONFIG="$DOCKER_CFG" docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null \
      || die "registry login failed (check $REGISTRY_ENV)"
  fi
  note "pulling $ref"
  if ! out="$(DOCKER_CONFIG="$DOCKER_CFG" docker pull "$ref" 2>&1)"; then
    if grep -qiE 'manifest unknown|not found|no such manifest' <<<"$out"; then
      note "image $ref is not in the registry yet (GitHub Actions build-web-image may still be running, or it failed)"
      exit "$EXIT_NOT_READY"
    fi
    printf '%s\n' "$out" >&2
    die "could not pull $ref (denied or unauthorized: $REGISTRY_ENV missing, or its token lacks read:packages)"
  fi
  rev="$(image_revision "$ref")"
  if [[ "$rev" != "$SHA" ]]; then
    docker rmi "$ref" >/dev/null 2>&1 || true
    die "pulled image $ref carries revision '$rev', not $SHA; refusing it"
  fi
  docker tag "$ref" "$IMAGE"
  docker rmi "$ref" >/dev/null
  note "image $IMAGE ready (revision verified)"
}

if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  [[ "$(image_revision "$IMAGE")" == "$SHA" ]] || die "$IMAGE exists but its revision label is not $SHA"
  note "image $IMAGE already present; reusing it"
else
  pull_image
fi

LOG_OPTS=(--log-driver json-file --log-opt max-size=10m --log-opt max-file=3)

# ----------------------------------------------------------------------------- candidate
CREATED_CANDIDATE=0
STOPPED=0
SWITCHED=0
DEPLOY_OK=0
HAD_PREVIOUS=0
restore_previous() {
  set +e
  warn "restoring the previous web container"
  docker rm -f "$APP" >/dev/null 2>&1
  if [[ "$HAD_PREVIOUS" == "1" ]]; then
    docker rename "$PREVIOUS" "$APP" && docker start "$APP" >/dev/null
    if check_web "http://127.0.0.1:$PROD_PORT"; then warn "PREVIOUS WEB CONTAINER RESTORED on 127.0.0.1:$PROD_PORT"; else warn "RESTORE FAILED: intervene now (docker ps -a | grep $APP)"; fi
  else
    warn "there was no previous web container; $APP is not running. nginx location / now answers 502 if the cutover is live."
  fi
}
on_exit() {
  local code=$?
  set +e
  [[ "$CREATED_CANDIDATE" == "1" ]] && docker rm -f "$CANDIDATE" >/dev/null 2>&1
  if [[ "$SWITCHED" == "1" && "$DEPLOY_OK" != "1" ]]; then
    restore_previous
  elif [[ "$STOPPED" == "1" && "$SWITCHED" != "1" ]]; then
    # Stopped but never renamed (the rename failed): the old container still holds the name.
    warn "restarting $APP, which was stopped before the switch failed"
    docker start "$APP" >/dev/null 2>&1
  fi
  exit "$code"
}
trap on_exit EXIT

run docker run -d --name "$CANDIDATE" --restart no -p "127.0.0.1:$CANDIDATE_PORT:$APP_PORT" "${LOG_OPTS[@]}" "$IMAGE"
if [[ "$EXECUTE" == "1" ]]; then
  CREATED_CANDIDATE=1
  note "checking the candidate on 127.0.0.1:$CANDIDATE_PORT"
  if ! check_web "http://127.0.0.1:$CANDIDATE_PORT"; then
    docker logs --tail 60 "$CANDIDATE" >&2 || true
    die "candidate failed its checks; it has been removed and production was NOT touched"
  fi
else
  note "[dry-run] would check / (title contains P91), /services/paint-protection-film (200) and /sitemap.xml on 127.0.0.1:$CANDIDATE_PORT"
fi
run docker rm -f "$CANDIDATE"
CREATED_CANDIDATE=0

# ----------------------------------------------------------------------------- switch
reminder_window_guard
if exists "$APP"; then
  exists "$PREVIOUS" && run docker rm -f "$PREVIOUS"
  run docker stop -t 20 "$APP"
  [[ "$EXECUTE" == "1" ]] && STOPPED=1
  run docker rename "$APP" "$PREVIOUS"
  HAD_PREVIOUS=1
fi
# From here the name $APP belongs to the new container; a failure restores $PREVIOUS.
[[ "$EXECUTE" == "1" ]] && SWITCHED=1
run docker run -d --name "$APP" --restart unless-stopped -p "127.0.0.1:$PROD_PORT:$APP_PORT" "${LOG_OPTS[@]}" "$IMAGE"

ROLLBACK_CMD="docker rm -f $APP && docker rename $PREVIOUS $APP && docker start $APP"
if [[ "$EXECUTE" != "1" ]]; then
  note "[dry-run] would verify 127.0.0.1:$PROD_PORT with the same checks, and restore $PREVIOUS on failure"
  note "DRY-RUN COMPLETE. Nothing was changed. Rerun with --execute."
  exit 0
fi
check_web "http://127.0.0.1:$PROD_PORT" || die "new $APP failed its checks on 127.0.0.1:$PROD_PORT"
DEPLOY_OK=1
install -d -m 700 "$STATE_DIR"
echo "$(date -u +%FT%TZ) WEB DEPLOY ok: $SHA as $IMAGE on 127.0.0.1:$PROD_PORT" >> "$STATE_DIR/deploys.log"
note "DEPLOYED web $SHA on 127.0.0.1:$PROD_PORT"
if [[ "$HAD_PREVIOUS" == "1" ]]; then
  note "  previous: $PREVIOUS (stopped, kept)"
  note "  roll back: sudo $ROLLBACK_CMD"
else
  note "  first web deploy: nothing to roll back to. To take it down: sudo docker rm -f $APP"
fi
