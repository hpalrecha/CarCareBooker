#!/usr/bin/env bash
# =============================================================================
# Install (or remove) the chat watchdog timer on the Lightsail host.
#
# DRY-RUN BY DEFAULT: prints the unit files and changes nothing.
#
#   sudo scripts/install-chat-watchdog.sh                  # show what it would install
#   sudo scripts/install-chat-watchdog.sh --execute        # install and start the timer
#   sudo scripts/install-chat-watchdog.sh --uninstall --execute
#
# Runs scripts/chat-watchdog.sh --execute every INTERVAL (default 5 minutes). See that script's
# header for what it checks and when it redeploys.
#
# AFTER INSTALLING:
#   systemctl list-timers p91-chat-watchdog.timer --no-pager
#   tail -f /var/log/p91-chat-watchdog.log
#   sudo touch /var/lib/carcarebooker-deploy/chat-watchdog.disabled   # pause it
# =============================================================================
set -Eeuo pipefail

INTERVAL="${INTERVAL:-5min}"
REPO_DIR="${P91_REPO_DIR:-/home/ubuntu/CarCareBooker}"
STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
PUBLIC_URL="${P91_PUBLIC_URL:-https://p91carcare.com}"
SCRIPT_PATH="${P91_WATCHDOG_PATH:-$STATE_DIR/bin/chat-watchdog.sh}"
UNIT_DIR="/etc/systemd/system"
EXECUTE=0
UNINSTALL=0

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help) sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

note() { printf '[install] %s\n' "$*"; }
die()  { printf '[install] FAILED: %s\n' "$*" >&2; exit 1; }
act()  { if [[ "$EXECUTE" == "1" ]]; then "$@"; else note "[dry-run] would run: $*"; fi; }

[[ "$EXECUTE" == "1" && "$(id -u)" != "0" ]] && die "run with sudo: the units live in $UNIT_DIR"
command -v systemctl >/dev/null || die "systemd not found"

SERVICE="$UNIT_DIR/p91-chat-watchdog.service"
TIMER="$UNIT_DIR/p91-chat-watchdog.timer"

if [[ "$UNINSTALL" == "1" ]]; then
  act systemctl disable --now p91-chat-watchdog.timer
  act rm -f "$SERVICE" "$TIMER"
  act systemctl daemon-reload
  note "done"
  exit 0
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$HERE/chat-watchdog.sh" ]] || die "chat-watchdog.sh not found next to this script"

service_unit="[Unit]
Description=P91 Car Care: check the chatbot has its OpenAI key, repair if not
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
# A repair is a full deploy and can take ~30 minutes.
TimeoutStartSec=3600
Environment=P91_REPO_DIR=$REPO_DIR
Environment=P91_DEPLOY_STATE_DIR=$STATE_DIR
Environment=P91_PUBLIC_URL=$PUBLIC_URL
ExecStart=$SCRIPT_PATH --execute
"

timer_unit="[Unit]
Description=P91 Car Care: chat watchdog schedule

[Timer]
OnBootSec=3min
OnUnitActiveSec=$INTERVAL
Persistent=true
Unit=p91-chat-watchdog.service

[Install]
WantedBy=timers.target
"

note "interval: $INTERVAL   script: $SCRIPT_PATH"
if [[ "$EXECUTE" != "1" ]]; then
  note "would write $SERVICE:"; printf '%s\n' "$service_unit"
  note "would write $TIMER:";   printf '%s\n' "$timer_unit"
  note "run again with --execute to install"
  exit 0
fi

install -d -m 700 "$STATE_DIR/bin"
install -m 700 "$HERE/chat-watchdog.sh" "$SCRIPT_PATH"
printf '%s' "$service_unit" > "$SERVICE"
printf '%s' "$timer_unit" > "$TIMER"
chmod 644 "$SERVICE" "$TIMER"
systemctl daemon-reload
systemctl enable --now p91-chat-watchdog.timer

note "installed. Next run:"
systemctl list-timers p91-chat-watchdog.timer --no-pager || true
note "log: tail -f /var/log/p91-chat-watchdog.log"
