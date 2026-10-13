#!/usr/bin/env bash
# =============================================================================
# Keep the chatbot working: notice when the running container has no OPENAI_API_KEY,
# say so in the log, and put back a correctly built container.
#
# DRY-RUN BY DEFAULT.
#   scripts/chat-watchdog.sh             # report only
#   scripts/chat-watchdog.sh --execute   # report, and repair when needed (what the timer runs)
#
# WHY THIS EXISTS. Something on the host has more than once replaced the production container
# with `carcarebooker:new`: an image with no revision label and no OPENAI_API_KEY. The site stays up,
# but POST /api/chat answers 503 ("Chat isn't available right now") until someone redeploys by hand.
# auto-deploy.sh does not repair it: it refuses to act when the running image has no revision label.
#
# WHAT IT CHECKS, once per tick (it never calls OpenAI, so it costs nothing):
#   1. the container exists and is running;
#   2. the container has a non-empty OPENAI_API_KEY (name only is read; the value is never printed);
#   3. the public site answers 200 on / and /api/services.
# It also records the container's image, revision label and start time. When any of them changes
# between ticks it logs the old and new values with a timestamp, which is the evidence needed to find
# out what keeps replacing the container (compare with `last`, `journalctl`, `crontab -l`).
#
# WHAT IT DOES WHEN THE KEY IS MISSING (--execute only):
#   Runs deploy-manual.sh from origin/main, exactly as auto-deploy.sh does. deploy-manual.sh adds
#   $STATE_DIR/extra.env (where the key lives), health-checks a candidate, and rolls back on failure.
#   At most one repair per COOLDOWN (default 30 min) so a broken commit cannot cause a rebuild loop.
#   It takes the same lock as auto-deploy.sh, so the two never run together.
#
# TO STOP IT: sudo touch /var/lib/carcarebooker-deploy/chat-watchdog.disabled
#
# Environment overrides: P91_REPO_DIR, P91_BRANCH, P91_DEPLOY_STATE_DIR, P91_PUBLIC_URL,
# P91_WATCHDOG_LOG, P91_WATCHDOG_COOLDOWN (seconds).
# =============================================================================
set -Eeuo pipefail

APP="carcarebooker"
REPO_DIR="${P91_REPO_DIR:-/home/ubuntu/CarCareBooker}"
BRANCH="${P91_BRANCH:-main}"
readonly STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
PUBLIC_URL="${P91_PUBLIC_URL:-https://p91carcare.com}"
LOG="${P91_WATCHDOG_LOG:-/var/log/p91-chat-watchdog.log}"
COOLDOWN="${P91_WATCHDOG_COOLDOWN:-1800}"
DISABLED="$STATE_DIR/chat-watchdog.disabled"
LAST_SEEN="$STATE_DIR/chat-watchdog.last-seen"
LAST_REPAIR="$STATE_DIR/chat-watchdog.last-repair"
EXECUTE=0

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=1 ;;
    -h|--help) sed -n '2,34p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

ts()   { date -u +%FT%TZ; }
note() { printf '%s [chat-watchdog] %s\n' "$(ts)" "$*"; }
die()  { printf '%s [chat-watchdog] FAILED: %s\n' "$(ts)" "$*" >&2; exit 1; }

if [[ "$EXECUTE" == "1" ]]; then
  install -d -m 755 "$(dirname "$LOG")" 2>/dev/null || true
  exec > >(tee -a "$LOG") 2>&1
fi

for bin in git docker flock curl; do command -v "$bin" >/dev/null || die "missing required command: $bin"; done
docker info >/dev/null 2>&1 || die "cannot talk to Docker (need root or the docker group)"
install -d -m 700 "$STATE_DIR"
[[ -e "$DISABLED" ]] && { note "disabled by $DISABLED; skipping"; exit 0; }

# --- identity of what is running --------------------------------------------------------------
if ! docker inspect "$APP" >/dev/null 2>&1; then
  note "ALERT: no container named $APP exists"
  exit 1
fi
state="$(docker inspect -f '{{.State.Status}}' "$APP" 2>/dev/null || echo unknown)"
image_ref="$(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null || echo unknown)"
image_id="$(docker inspect -f '{{.Image}}' "$APP" 2>/dev/null || true)"
started="$(docker inspect -f '{{.State.StartedAt}}' "$APP" 2>/dev/null || echo unknown)"
rev="$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image_id" 2>/dev/null || true)"
now_seen="image=$image_ref rev=${rev:0:7} started=$started"

if [[ -f "$LAST_SEEN" ]]; then
  before="$(cat "$LAST_SEEN" 2>/dev/null || true)"
  if [[ "$before" != "$now_seen" ]]; then
    note "CONTAINER CHANGED"
    note "  before: $before"
    note "  after:  $now_seen"
  fi
fi
printf '%s' "$now_seen" > "$LAST_SEEN"

problem=""
if [[ "$state" != "running" ]]; then
  problem="container state is '$state', not running"
fi

# Name only: the key's value is never read into a variable or printed.
key_ok=0
if [[ "$state" == "running" ]]; then
  docker exec "$APP" sh -c 'test -n "$OPENAI_API_KEY"' >/dev/null 2>&1 && key_ok=1 || true
  [[ "$key_ok" == "1" ]] || problem="${problem:+$problem; }OPENAI_API_KEY is missing or empty in the container (chat answers 503)"
fi

for path in / /api/services; do
  code="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$PUBLIC_URL$path" || true)"
  [[ "$code" == "200" ]] || problem="${problem:+$problem; }$PUBLIC_URL$path answered ${code:-no response}"
done

if [[ -z "$problem" ]]; then
  note "ok: $now_seen, key present, site 200"
  exit 0
fi
note "PROBLEM: $problem"
note "  running: $now_seen"

# Only a missing key is repaired automatically. A stopped container or a failing page needs a person.
if [[ "$key_ok" == "1" || "$state" != "running" ]]; then
  note "not a missing-key problem; not repairing automatically"
  exit 1
fi

if [[ "$EXECUTE" != "1" ]]; then
  note "[dry-run] would redeploy origin/$BRANCH with deploy-manual.sh (run with --execute)"
  exit 1
fi

# --- repair -------------------------------------------------------------------------------------
if [[ -f "$LAST_REPAIR" ]]; then
  age=$(( $(date +%s) - $(stat -c %Y "$LAST_REPAIR") ))
  if (( age < COOLDOWN )); then
    note "repair attempted ${age}s ago (cooldown ${COOLDOWN}s); waiting"
    exit 1
  fi
fi

# Same lock as auto-deploy.sh: never run two deploys at once.
exec 8>"$STATE_DIR/auto-deploy.lock"
flock -n 8 || { note "a deploy is already running; will look again next tick"; exit 0; }

g() {
  local owner; owner="$(stat -c %U "$REPO_DIR")"
  if [[ "$(id -un)" == "root" && "$owner" != "root" ]]; then
    sudo -u "$owner" git -C "$REPO_DIR" "$@"
  else
    git -C "$REPO_DIR" "$@"
  fi
}
[[ -d "$REPO_DIR/.git" ]] || die "$REPO_DIR is not a Git checkout (set P91_REPO_DIR)"
g fetch --quiet origin "$BRANCH" || die "git fetch failed"
TARGET="$(g rev-parse "origin/$BRANCH")"
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || die "could not read origin/$BRANCH"

DEPLOY_SH="$STATE_DIR/bin/deploy-manual-$TARGET.sh"
install -d -m 700 "$STATE_DIR/bin"
g show "$TARGET:scripts/deploy-manual.sh" > "$DEPLOY_SH" || die "commit has no scripts/deploy-manual.sh"
chmod 700 "$DEPLOY_SH"

: > "$LAST_REPAIR"
note "repairing: deploying ${TARGET:0:7} (deploy-manual.sh adds extra.env, health-checks, rolls back on failure)"
if "$DEPLOY_SH" deploy "$TARGET" --execute --repo "$REPO_DIR" --public-url "$PUBLIC_URL"; then
  if docker exec "$APP" sh -c 'test -n "$OPENAI_API_KEY"' >/dev/null 2>&1; then
    note "repaired: key present in the new container"
    exit 0
  fi
  note "ALERT: deploy succeeded but the container still has no OPENAI_API_KEY."
  note "  Check that $STATE_DIR/extra.env defines OPENAI_API_KEY."
  exit 1
else
  status=$?
  if [[ "$status" == "75" ]]; then
    note "the prebuilt image for ${TARGET:0:7} is not in the registry yet; will retry after the cooldown"
    exit 1
  fi
  note "ALERT: repair deploy failed (exit $status). deploy-manual.sh restored the previous container."
  exit "$status"
fi
