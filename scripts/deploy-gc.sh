#!/usr/bin/env bash
# =============================================================================
# Reclaim disk left behind by deploys, on the Lightsail host.
#
# DRY-RUN BY DEFAULT. Without --execute it only reads: it prints what it would
# remove and what that would free. Nothing is deleted.
#
#   scripts/deploy-gc.sh            # show what would be removed
#   scripts/deploy-gc.sh --execute  # remove it
#
# WHY THIS EXISTS. Every deploy builds a fresh image of the whole site and keeps
# the previous container so a rollback is one command away. Nothing ever removed
# the older ones, so the host accumulated, per deploy:
#
#   - an image  carcarebooker:git-<sha>          (the site, ~hundreds of MB)
#   - a stopped container carcarebooker-prev-<ts>
#   - an uploads backup   /var/lib/carcarebooker-deploy/backups/<ts>
#   - Docker build cache from `docker build`
#
# WHAT IT NEVER TOUCHES:
#   - the running container and the image it runs;
#   - the newest KEEP_PREV rollback containers and their images, so
#     `deploy-manual.sh rollback` still works;
#   - the newest KEEP_BACKUPS uploads backups;
#   - anything outside the deploy state directory and the carcarebooker images.
#
# Environment overrides: KEEP_PREV (default 1), KEEP_BACKUPS (3),
# BUILD_CACHE_GB (2), P91_DEPLOY_STATE_DIR.
# =============================================================================
set -Eeuo pipefail

APP="carcarebooker"
IMAGE_REPO="carcarebooker"
readonly STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
KEEP_PREV="${KEEP_PREV:-1}"
KEEP_BACKUPS="${KEEP_BACKUPS:-3}"
BUILD_CACHE_GB="${BUILD_CACHE_GB:-2}"
EXECUTE=0

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=1 ;;
    -h|--help) sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

note() { printf '[gc] %s\n' "$*"; }
act()  { if [[ "$EXECUTE" == "1" ]]; then note "run: $*"; "$@"; else note "[dry-run] would run: $*"; fi; }
die()  { printf '[gc] FAILED: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker not found"
docker info >/dev/null 2>&1 || die "cannot talk to Docker (need root or the docker group)"

if [[ "$EXECUTE" == "1" ]]; then note "MODE: EXECUTE"; else note "MODE: DRY-RUN (nothing will be removed)"; fi

disk_free() { df -Pk / | awk 'NR==2 {print $4}'; }
BEFORE_FREE="$(disk_free)"

# ---------------------------------------------------------------- what is live
# The image the running container uses is off limits, whatever else is found.
LIVE_IMAGE=""
if docker inspect "$APP" >/dev/null 2>&1; then
  LIVE_IMAGE="$(docker inspect -f '{{.Config.Image}}' "$APP")"
  note "running container $APP uses image: $LIVE_IMAGE"
else
  note "no running container named $APP — only stale artefacts will be considered"
fi

# ------------------------------------------------- rollback containers (newest first)
mapfile -t PREVS < <(docker ps -a --filter "name=^${APP}-prev-" --format '{{.Names}}' | sort -r)
note "rollback containers: ${#PREVS[@]} (keeping newest $KEEP_PREV)"

KEEP_IMAGES=("$LIVE_IMAGE")
for i in "${!PREVS[@]}"; do
  name="${PREVS[$i]}"
  if (( i < KEEP_PREV )); then
    keep_img="$(docker inspect -f '{{.Config.Image}}' "$name" 2>/dev/null || true)"
    [[ -n "$keep_img" ]] && KEEP_IMAGES+=("$keep_img")
    note "keep  $name (rollback target, image $keep_img)"
  else
    note "stale $name"
    act docker rm "$name"
  fi
done

# ------------------------------------------------------------------ images
# Every image any container references, running or stopped, by ID and by the tag it
# was created from. Nothing in this set is ever a candidate: `docker rmi` would refuse
# anyway, and asking is how we find out before trying.
mapfile -t IN_USE < <(docker ps -aq 2>/dev/null | xargs -r docker inspect -f '{{.Image}}
{{.Config.Image}}' 2>/dev/null | sort -u)

# Only tags this project's deploy script creates: git-<sha> builds and rollback-<ts>
# references. Images tagged any other way were built by hand before deploy-manual.sh
# existed — this host has several — and are left alone, because nothing here knows
# what they are for. Note the two reference filters: Docker ORs them, which is why
# passing the repository as a positional argument as well would match the whole
# repository and put those hand-built tags back in scope.
mapfile -t IMAGES < <(docker images \
  --filter "reference=${IMAGE_REPO}:git-*" \
  --filter "reference=${IMAGE_REPO}:rollback-*" \
  --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.Size}}' | sort -r)

# Rollback references are what `deploy-manual.sh rollback` retags from; keep the newest.
rollbacks_kept=0
removed_images=0
for row in "${IMAGES[@]:-}"; do
  [[ -z "$row" ]] && continue
  read -r tag id size <<<"$row"
  keep=""
  for k in "${KEEP_IMAGES[@]}"; do [[ -n "$k" && "$tag" == "$k" ]] && keep="live or rollback container"; done
  if [[ -z "$keep" ]]; then
    for u in "${IN_USE[@]:-}"; do
      [[ -n "$u" && ( "$tag" == "$u" || "$id" == "$u" || "$u" == "$id"* ) ]] && keep="used by a container"
    done
  fi
  if [[ -z "$keep" && "$tag" == "$IMAGE_REPO:rollback-"* ]] && (( rollbacks_kept < KEEP_PREV )); then
    keep="newest rollback reference"
    rollbacks_kept=$((rollbacks_kept + 1))
  fi
  if [[ -n "$keep" ]]; then
    note "keep  image $tag ($size) — $keep"
  else
    note "stale image $tag ($size)"
    # `docker rmi` still refuses while a container references it: the last backstop.
    act docker rmi "$tag"
    removed_images=$((removed_images + 1))
  fi
done

# ------------------------------------------------------- backups and build dirs
if [[ -d "$STATE_DIR/backups" ]]; then
  mapfile -t BACKUPS < <(ls -1 "$STATE_DIR/backups" 2>/dev/null | sort -r)
  note "uploads backups: ${#BACKUPS[@]} (keeping newest $KEEP_BACKUPS)"
  for i in "${!BACKUPS[@]}"; do
    (( i < KEEP_BACKUPS )) && continue
    act rm -rf "$STATE_DIR/backups/${BACKUPS[$i]}"
  done
fi

# Build trees are removed by a successful deploy; these are leftovers from runs
# that failed or were interrupted.
if [[ -d "$STATE_DIR/build" ]]; then
  while IFS= read -r -d '' dir; do
    note "stale build tree $dir"
    act rm -rf "$dir"
  done < <(find "$STATE_DIR/build" -mindepth 1 -maxdepth 1 -type d -mmin +60 -print0 2>/dev/null)
fi

# Env files written per deploy (mode 600, one per run).
if [[ -d "$STATE_DIR/run" ]]; then
  while IFS= read -r -d '' f; do act rm -f "$f"; done \
    < <(find "$STATE_DIR/run" -maxdepth 1 -type f -name 'env-*' -mmin +1440 -print0 2>/dev/null)
fi

# ------------------------------------------------------------------ build cache
# Capped rather than emptied: an empty cache makes the next deploy a full rebuild.
# Docker renamed --keep-storage to --reserved-space; the old name still works but
# warns, and will eventually stop working. Ask this docker which one it takes.
if docker builder prune --help 2>&1 | grep -q -- '--reserved-space'; then
  act docker builder prune -f --reserved-space "${BUILD_CACHE_GB}GB"
else
  act docker builder prune -f --keep-storage "${BUILD_CACHE_GB}GB"
fi
act docker image prune -f   # dangling layers only

AFTER_FREE="$(disk_free)"
FREED_MB=$(( (AFTER_FREE - BEFORE_FREE) / 1024 ))
note "images removed: $removed_images"
if [[ "$EXECUTE" == "1" ]]; then
  note "disk freed: ${FREED_MB} MB (now $((AFTER_FREE / 1024 / 1024)) GB free on /)"
else
  note "run again with --execute to remove the above"
fi
