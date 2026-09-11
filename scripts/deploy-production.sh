#!/usr/bin/env bash
# Deploy one immutable Git commit to the existing Lightsail Docker topology.
#
# This script is deliberately fail-closed: it will not infer a branch, an env
# file, or a public URL. Those host-local settings belong in
# /etc/carcarebooker-deploy.env and are never committed.
#
# Usage (executed on Lightsail):
#   sudo /path/to/deploy-production.sh <40-character-git-sha>
set -Eeuo pipefail

readonly APP_NAME="carcarebooker"
readonly APP_PORT="5000"
readonly PROD_PORT="8084"
readonly CONFIG_FILE="/etc/carcarebooker-deploy.env"
readonly LOCK_FILE="/var/lock/carcarebooker-deploy.lock"
readonly HEALTH_PATH="/api/business-hours"

die() { echo "DEPLOYMENT FAILED: $*" >&2; exit 1; }
note() { echo "[deploy] $*"; }

[[ $# -eq 1 ]] || die "usage: $0 <exact-40-character-git-sha>"
SHA="$1"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "refusing non-immutable commit SHA"
[[ -r "$CONFIG_FILE" ]] || die "missing $CONFIG_FILE (host-local deploy configuration)"

# shellcheck disable=SC1090
source "$CONFIG_FILE"
: "${P91_REPOSITORY_DIR:?set P91_REPOSITORY_DIR in $CONFIG_FILE}"
: "${P91_ENV_FILE:?set P91_ENV_FILE in $CONFIG_FILE}"
: "${P91_PUBLIC_HEALTH_URL:?set P91_PUBLIC_HEALTH_URL in $CONFIG_FILE}"
[[ -d "$P91_REPOSITORY_DIR/.git" ]] || die "P91_REPOSITORY_DIR is not the expected Git checkout"
[[ -r "$P91_ENV_FILE" ]] || die "P91_ENV_FILE is not readable"
[[ "$P91_PUBLIC_HEALTH_URL" =~ ^https?:// ]] || die "P91_PUBLIC_HEALTH_URL must start with http:// or https://"

exec 9>"$LOCK_FILE"
flock -n 9 || die "another deployment is already running"

WORKTREE="$P91_REPOSITORY_DIR/.deploy-worktrees/$SHA"
CANDIDATE_NAME="${APP_NAME}-candidate-${SHA:0:12}"
CANDIDATE_PORT="${P91_CANDIDATE_PORT:-18084}"
IMAGE_SHA="$APP_NAME:$SHA"
IMAGE_LATEST="$APP_NAME:latest"
IMAGE_PREV="$APP_NAME:prev"
OLD_IMAGE_ID=""
SWITCHED=0

cleanup_candidate() {
  docker rm -f "$CANDIDATE_NAME" >/dev/null 2>&1 || true
}

wait_for_app() {
  local port="$1" tries=30 body status
  for ((i=1; i<=tries; i++)); do
    body=$(mktemp)
    status=$(curl --silent --show-error --max-time 5 -o "$body" -w '%{http_code}' "http://127.0.0.1:${port}${HEALTH_PATH}" || true)
    if [[ "$status" == "200" ]] && grep -q 'dayOfWeek' "$body"; then
      rm -f "$body"
      return 0
    fi
    rm -f "$body"
    sleep 2
  done
  return 1
}

wait_for_docker_health() {
  local name="$1" tries=30 health
  for ((i=1; i<=tries; i++)); do
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$name" 2>/dev/null || true)
    [[ "$health" == "healthy" ]] && return 0
    [[ "$health" == "unhealthy" || "$health" == "missing" ]] && return 1
    sleep 2
  done
  return 1
}

rollback() {
  [[ "$SWITCHED" == "1" && -n "$OLD_IMAGE_ID" ]] || return 0
  note "post-switch verification failed; restoring previous image"
  docker rm -f "$APP_NAME" >/dev/null 2>&1 || true
  docker run -d --name "$APP_NAME" --restart unless-stopped \
    "${VOLUME_ARGS[@]}" --env-file "$P91_ENV_FILE" -p "127.0.0.1:${PROD_PORT}:${APP_PORT}" "$OLD_IMAGE_ID" >/dev/null || true
  wait_for_docker_health "$APP_NAME" && wait_for_app "$PROD_PORT" || true
}

trap cleanup_candidate EXIT

VOLUME_ARGS=()
if [[ -n "${P91_UPLOADS_DIR:-}" && -d "$P91_UPLOADS_DIR" ]]; then
  VOLUME_ARGS=(-v "$P91_UPLOADS_DIR:/app/uploads")
elif [[ -d "/root/carcare-uploads" ]]; then
  VOLUME_ARGS=(-v "/root/carcare-uploads:/app/uploads")
fi

note "recording current production state"
docker inspect "$APP_NAME" >/dev/null 2>&1 || die "expected running container '$APP_NAME' not found"
[[ "$(docker inspect -f '{{.State.Running}}' "$APP_NAME")" == "true" ]] || die "current production container is not running"
[[ "$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$APP_NAME")" == "unless-stopped" ]] || die "unexpected restart policy"
UNMODELLED_MOUNTS=$(docker inspect -f '{{range .Mounts}}{{if ne .Destination "/app/uploads"}}{{.Destination}}{{"\n"}}{{end}}{{end}}' "$APP_NAME" || true)
[[ -z "$UNMODELLED_MOUNTS" ]] || die "refusing to replace container with unmodelled mounts: $UNMODELLED_MOUNTS"
OLD_IMAGE_ID=$(docker inspect -f '{{.Image}}' "$APP_NAME")
docker tag "$OLD_IMAGE_ID" "$IMAGE_PREV"

note "fetching exact GitHub commit $SHA"
git -C "$P91_REPOSITORY_DIR" fetch --no-tags origin "$SHA"
[[ "$(git -C "$P91_REPOSITORY_DIR" rev-parse FETCH_HEAD)" == "$SHA" ]] || die "fetched commit does not match requested SHA"

if [[ -e "$WORKTREE" ]]; then
  [[ "$(git -C "$WORKTREE" rev-parse HEAD)" == "$SHA" ]] || die "existing worktree belongs to a different commit"
else
  mkdir -p "$(dirname "$WORKTREE")"
  git -C "$P91_REPOSITORY_DIR" worktree add --detach "$WORKTREE" "$SHA"
fi

note "building versioned image $IMAGE_SHA"
docker build --build-arg "GIT_SHA=$SHA" -t "$IMAGE_SHA" "$WORKTREE"

note "starting temporary candidate on 127.0.0.1:$CANDIDATE_PORT"
docker run -d --name "$CANDIDATE_NAME" --restart no \
  "${VOLUME_ARGS[@]}" --env-file "$P91_ENV_FILE" -p "127.0.0.1:${CANDIDATE_PORT}:${APP_PORT}" "$IMAGE_SHA" >/dev/null
wait_for_docker_health "$CANDIDATE_NAME" || die "candidate container did not become healthy"
wait_for_app "$CANDIDATE_PORT" || die "candidate API health check failed"

note "candidate healthy; replacing fixed-port production container"
SWITCHED=1
if ! docker stop --time 20 "$APP_NAME" >/dev/null; then rollback; die "could not stop current production container"; fi
if ! docker rm "$APP_NAME" >/dev/null; then rollback; die "could not remove stopped production container"; fi
docker tag "$IMAGE_SHA" "$IMAGE_LATEST"
if ! docker run -d --name "$APP_NAME" --restart unless-stopped \
  "${VOLUME_ARGS[@]}" --env-file "$P91_ENV_FILE" -p "127.0.0.1:${PROD_PORT}:${APP_PORT}" "$IMAGE_SHA" >/dev/null; then rollback; die "could not start replacement container"; fi

if ! wait_for_docker_health "$APP_NAME"; then rollback; die "replacement container did not become healthy"; fi
if ! wait_for_app "$PROD_PORT"; then rollback; die "replacement API health check failed"; fi

note "checking public Nginx route"
PUBLIC_BODY=$(mktemp)
if ! curl --fail --silent --show-error --max-time 15 -o "$PUBLIC_BODY" "$P91_PUBLIC_HEALTH_URL" || ! grep -q 'dayOfWeek' "$PUBLIC_BODY"; then
  rm -f "$PUBLIC_BODY"
  rollback
  die "public health check failed"
fi
rm -f "$PUBLIC_BODY"
note "success: $SHA is running as $IMAGE_SHA; rollback image is $IMAGE_PREV"
