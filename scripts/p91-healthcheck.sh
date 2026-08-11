#!/usr/bin/env bash
# P91 Car Care host/container health check.
#
# READ-ONLY BY DESIGN. It never deletes, prunes, removes or recreates anything.
# The only docker subcommands it uses are `ps`, `inspect` and `system df`.
# A disk or cache warning is a prompt to investigate, never an automatic clean-up.
#
# Install:  sudo cp scripts/p91-healthcheck.sh /usr/local/bin/ && sudo chmod +x /usr/local/bin/p91-healthcheck.sh
# Run:      sudo /usr/local/bin/p91-healthcheck.sh
# Schedule: echo '*/15 * * * * root /usr/local/bin/p91-healthcheck.sh >/dev/null 2>&1' | sudo tee /etc/cron.d/p91-health
# History:  journalctl -t p91-health --since '24 hours ago'
set -uo pipefail

NAME=carcarebooker
PORT=8084
WARN=75           # disk % warning
CRIT=85           # disk % critical
CACHE_WARN_GB=15  # docker build cache warning
HEARTBEAT_FILE=/etc/p91-heartbeat-url

fail=0
log() { logger -t p91-health "$1"; echo "$1"; }

# 1. container running
if ! docker ps --filter "name=^/${NAME}$" --filter status=running -q | grep -q .; then
  log "CRITICAL: container ${NAME} is not running"; fail=1
else
  # 2. docker health status (from the HEALTHCHECK baked into the image)
  h=$(docker inspect -f '{{.State.Health.Status}}' "$NAME" 2>/dev/null || echo unknown)
  [ "$h" = "healthy" ] || { log "WARNING: container health=${h}"; fail=1; }

  # 3. restart policy must survive a reboot
  p=$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$NAME" 2>/dev/null || echo none)
  case "$p" in unless-stopped|always) ;; *) log "WARNING: restart policy is '${p}'"; fail=1;; esac
fi

# 4. HTTP + database reachability in a single call. The rows come from Postgres, so a
#    200 containing dayOfWeek proves process + HTTP + database all at once.
code=$(curl -s -o /tmp/p91-health.json -m 15 -w '%{http_code}' \
       "http://127.0.0.1:${PORT}/api/business-hours" || echo 000)
if [ "$code" != "200" ]; then
  log "CRITICAL: /api/business-hours returned ${code}"; fail=1
elif ! grep -q dayOfWeek /tmp/p91-health.json; then
  log "CRITICAL: /api/business-hours returned 200 but no data (database unreachable?)"; fail=1
fi

# 5. A service image must be an image, not the SPA shell. This is the original silent
#    failure: HTTP 200 with text/html while every service image was broken.
ct=$(curl -s -o /dev/null -m 15 -w '%{content_type}' \
     "http://127.0.0.1:${PORT}/attached_assets/services/car-polishing.webp" || echo none)
case "$ct" in
  image/webp) ;;
  *) log "CRITICAL: service image served as '${ct}' — attached_assets missing from the image?"; fail=1;;
esac

# 6. disk — warn only
use=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if   [ "$use" -ge "$CRIT" ]; then log "CRITICAL: disk ${use}% (>= ${CRIT}%) — investigate, do NOT auto-delete"; fail=1
elif [ "$use" -ge "$WARN" ]; then log "WARNING: disk ${use}% (>= ${WARN}%)"; fail=1
fi

# 7. build cache growth — the weekly prune cron should keep this low
cache=$(docker system df --format '{{.Type}} {{.Size}}' 2>/dev/null | awk '/Build Cache/{print $3}')
case "$cache" in
  *GB) awk -v n="${cache%GB}" -v w="$CACHE_WARN_GB" 'BEGIN{exit !(n+0>w)}' \
        && { log "WARNING: docker build cache ${cache} (> ${CACHE_WARN_GB}GB) — weekly prune may not be running"; fail=1; } ;;
esac

if [ "$fail" -eq 0 ]; then
  log "OK: container healthy, api 200, assets image/webp, disk ${use}%, cache ${cache:-n/a}"
  # Optional: ping an external heartbeat only when everything passed.
  [ -s "$HEARTBEAT_FILE" ] && curl -fsS -m 10 "$(cat "$HEARTBEAT_FILE")" > /dev/null 2>&1
fi
exit "$fail"
