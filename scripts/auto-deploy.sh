#!/usr/bin/env bash
# =============================================================================
# Deploy origin/main automatically, from the Lightsail host.
#
# DRY-RUN BY DEFAULT.
#   scripts/auto-deploy.sh             # report only: is there a new commit?
#   scripts/auto-deploy.sh --execute   # deploy it if there is (what the timer runs)
#
# WHY PULL, NOT PUSH. Deploying from GitHub Actions needs repository secrets (an
# SSH key and the host), and only a repo admin can add those. This runs ON the
# host and only reads GitHub, so it needs no secrets, no inbound port and no
# admin rights — and nothing has to stay open in a browser terminal.
#
# WHAT IT DOES, once per timer tick:
#   1. refuses to run twice at once (its own lock);
#   2. `git fetch` and compare origin/main with the SHA the running container was
#      built from — equal means nothing to do, and it exits quietly;
#   3. takes deploy-manual.sh FROM that commit (the host checkout may be on an
#      old branch) and runs it with --execute;
#   4. on success, reclaims disk with deploy-gc.sh;
#   5. on failure, records the SHA and will not retry it — deploy-manual.sh has
#      already rolled the site back, and retrying a broken commit every few
#      minutes would rebuild the whole image each time.
#
# TO STOP IT: create the disable file (no root needed if you own it):
#   sudo touch /var/lib/carcarebooker-deploy/auto-deploy.disabled
# To resume, delete that file. To retry a commit that failed, delete
#   /var/lib/carcarebooker-deploy/auto-deploy.failed
#
# SAFETY. Everything that made the manual deploy safe still applies, because the
# same script does the work: it deploys a SHA that must exist in origin/main,
# builds and health-checks a candidate on port 18084 before touching production,
# keeps the previous container, and rolls back automatically if the new one fails
# its checks. It also refuses to deploy near 20:00 IST.
#
# Environment overrides: P91_REPO_DIR, P91_BRANCH, P91_DEPLOY_STATE_DIR,
# P91_PUBLIC_URL, P91_AUTO_DEPLOY_LOG.
# =============================================================================
set -Eeuo pipefail

APP="carcarebooker"
REPO_DIR="${P91_REPO_DIR:-/home/ubuntu/CarCareBooker}"
BRANCH="${P91_BRANCH:-main}"
readonly STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
PUBLIC_URL="${P91_PUBLIC_URL:-https://p91carcare.com}"
LOG="${P91_AUTO_DEPLOY_LOG:-/var/log/p91-auto-deploy.log}"
DISABLED="$STATE_DIR/auto-deploy.disabled"
FAILED="$STATE_DIR/auto-deploy.failed"
EXECUTE=0

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=1 ;;
    -h|--help) sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

ts()   { date -u +%FT%TZ; }
note() { printf '%s [auto-deploy] %s\n' "$(ts)" "$*"; }
die()  { printf '%s [auto-deploy] FAILED: %s\n' "$(ts)" "$*" >&2; exit 1; }

# Log to file AND stdout, so `journalctl -u p91-auto-deploy` and the log file
# both tell the whole story.
if [[ "$EXECUTE" == "1" ]]; then
  install -d -m 755 "$(dirname "$LOG")" 2>/dev/null || true
  exec > >(tee -a "$LOG") 2>&1
fi

for bin in git docker flock; do command -v "$bin" >/dev/null || die "missing required command: $bin"; done
[[ -d "$REPO_DIR/.git" ]] || die "$REPO_DIR is not a Git checkout (set P91_REPO_DIR)"
docker info >/dev/null 2>&1 || die "cannot talk to Docker (need root or the docker group)"

# One at a time. A deploy can take 30 minutes; the timer must not stack them.
install -d -m 700 "$STATE_DIR"
exec 8>"$STATE_DIR/auto-deploy.lock"
flock -n 8 || { note "another auto-deploy run is in progress; skipping this tick"; exit 0; }

[[ -e "$DISABLED" ]] && { note "disabled by $DISABLED — skipping"; exit 0; }

# git as the checkout's owner, so running under sudo never leaves root-owned
# objects in .git (same rule as deploy-manual.sh).
g() {
  local owner; owner="$(stat -c %U "$REPO_DIR")"
  if [[ "$(id -un)" == "root" && "$owner" != "root" ]]; then
    sudo -u "$owner" git -C "$REPO_DIR" "$@"
  else
    git -C "$REPO_DIR" "$@"
  fi
}

g fetch --quiet origin "$BRANCH" || die "git fetch failed (network or credentials)"
TARGET="$(g rev-parse "origin/$BRANCH")"
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || die "could not read origin/$BRANCH"

# What commit is actually running. The revision label is authoritative: deploy-manual.sh
# stamps every image it builds with org.opencontainers.image.revision. The tag is only a
# fallback, because images built by hand before that script existed carry tags like
# `carcarebooker:0f99f7b` or `carcarebooker:20260910` that say nothing reliable.
running_revision() {
  local img ref rev
  docker inspect "$APP" >/dev/null 2>&1 || return 0
  img="$(docker inspect -f '{{.Image}}' "$APP" 2>/dev/null || true)"
  rev="$(docker image inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$img" 2>/dev/null || true)"
  if [[ "$rev" =~ ^[0-9a-f]{40}$ ]]; then printf '%s' "$rev"; return 0; fi
  ref="$(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null || true)"
  [[ "$ref" =~ git-([0-9a-f]{40})$ ]] && printf '%s' "${BASH_REMATCH[1]}"
  return 0
}

RUNNING="$(running_revision)"
note "origin/$BRANCH = ${TARGET:0:7}   running = ${RUNNING:0:7}${RUNNING:-unknown}"

if [[ "$TARGET" == "$RUNNING" ]]; then
  note "already deployed; nothing to do"
  exit 0
fi

# Unknown is NOT a reason to deploy. If it were, every tick would find a mismatch and
# start another full rebuild, forever. The first deploy on a host whose image predates
# deploy-manual.sh has to be run by hand; after that the image carries a revision label
# and this can take over.
if [[ -z "$RUNNING" ]]; then
  note "cannot tell which commit the running container was built from:"
  note "  image $(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null || echo 'none') has no revision label."
  note "refusing to deploy automatically — that would rebuild the site on every tick."
  note "run one deploy by hand first:"
  note "  sudo bash scripts/deploy-manual.sh deploy $TARGET --execute"
  exit 0
fi

if [[ -f "$FAILED" && "$(cat "$FAILED" 2>/dev/null)" == "$TARGET" ]]; then
  note "commit ${TARGET:0:7} failed a previous deploy and will not be retried automatically"
  note "the site is running ${RUNNING:0:7}; fix the commit, or delete $FAILED to retry"
  exit 0
fi

# The deploy script comes from the COMMIT being deployed, not from the host's
# checkout, which may sit on an old branch (it does: add-clarity-tracking).
DEPLOY_SH="$STATE_DIR/bin/deploy-manual-$TARGET.sh"
if [[ "$EXECUTE" == "1" ]]; then
  install -d -m 700 "$STATE_DIR/bin"
  g show "$TARGET:scripts/deploy-manual.sh" > "$DEPLOY_SH" || die "commit has no scripts/deploy-manual.sh"
  chmod 700 "$DEPLOY_SH"
  GC_SH="$STATE_DIR/bin/deploy-gc-$TARGET.sh"
  g show "$TARGET:scripts/deploy-gc.sh" > "$GC_SH" 2>/dev/null && chmod 700 "$GC_SH" || GC_SH=""
else
  note "[dry-run] would deploy ${TARGET:0:7} with scripts/deploy-manual.sh from that commit"
  note "[dry-run] run with --execute to do it"
  exit 0
fi

note "deploying ${TARGET:0:7} — building and health-checking a candidate before production is touched"
if "$DEPLOY_SH" deploy "$TARGET" --execute --repo "$REPO_DIR" --public-url "$PUBLIC_URL"; then
  # Exit 0 is not proof. Confirm the container really is running the target commit
  # before believing it, or a silent no-op would be reported as a deploy and repeat
  # on every tick.
  NOW_RUNNING="$(running_revision)"
  if [[ "$NOW_RUNNING" != "$TARGET" ]]; then
    printf '%s' "$TARGET" > "$FAILED"
    note "deploy reported success but the running container is ${NOW_RUNNING:-unknown}, not ${TARGET:0:7}."
    note "treating that as a failure and stopping. Nothing was cleaned up."
    exit 1
  fi
  note "deployed ${TARGET:0:7} (verified from the running container)"
  rm -f "$FAILED"
  if [[ -n "$GC_SH" ]]; then
    note "reclaiming disk"
    "$GC_SH" --execute || note "cleanup reported a problem (the deploy itself succeeded)"
  fi
  note "done"
else
  status=$?
  printf '%s' "$TARGET" > "$FAILED"
  note "deploy of ${TARGET:0:7} FAILED (exit $status). deploy-manual.sh restores the previous"
  note "container on failure. This commit will not be retried until $FAILED is removed."
  exit "$status"
fi
