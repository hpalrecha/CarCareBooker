#!/usr/bin/env bash
# =============================================================================
# Install (or remove) the auto-deploy timer on the Lightsail host.
#
# DRY-RUN BY DEFAULT — it prints the unit files it would write and changes nothing.
#
#   sudo scripts/install-auto-deploy.sh                  # show what it would install
#   sudo scripts/install-auto-deploy.sh --execute        # install and start the timer
#   sudo scripts/install-auto-deploy.sh --uninstall --execute
#
# WHAT IT INSTALLS. A systemd timer that runs scripts/auto-deploy.sh every
# INTERVAL (default 5 minutes). systemd rather than cron because it gives a
# proper log (journalctl), does not email on every run, and will not start a
# second run while one is going (auto-deploy.sh also holds its own lock).
#
# The service runs as root: the deploy writes to /var/lib/carcarebooker-deploy
# (mode 700) and talks to Docker. It runs git as the checkout's owner, so the
# repository never ends up with root-owned objects.
#
# AFTER INSTALLING:
#   systemctl status p91-auto-deploy.timer        # is it scheduled?
#   journalctl -u p91-auto-deploy -f              # watch a deploy happen
#   tail -f /var/log/p91-auto-deploy.log          # same, as a file
#   sudo touch /var/lib/carcarebooker-deploy/auto-deploy.disabled   # pause it
# =============================================================================
set -Eeuo pipefail

INTERVAL="${INTERVAL:-5min}"
REPO_DIR="${P91_REPO_DIR:-/home/ubuntu/CarCareBooker}"
STATE_DIR="${P91_DEPLOY_STATE_DIR:-/var/lib/carcarebooker-deploy}"
PUBLIC_URL="${P91_PUBLIC_URL:-https://p91carcare.com}"
SCRIPT_PATH="${P91_AUTO_DEPLOY_PATH:-$STATE_DIR/bin/auto-deploy.sh}"
UNIT_DIR="/etc/systemd/system"
EXECUTE=0
UNINSTALL=0

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help) sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

note() { printf '[install] %s\n' "$*"; }
die()  { printf '[install] FAILED: %s\n' "$*" >&2; exit 1; }
act()  { if [[ "$EXECUTE" == "1" ]]; then "$@"; else note "[dry-run] would run: $*"; fi; }

[[ "$EXECUTE" == "1" && "$(id -u)" != "0" ]] && die "run with sudo: the units live in $UNIT_DIR"
command -v systemctl >/dev/null || die "systemd not found — use cron instead (see the README section printed by --help)"

SERVICE="$UNIT_DIR/p91-auto-deploy.service"
TIMER="$UNIT_DIR/p91-auto-deploy.timer"

if [[ "$UNINSTALL" == "1" ]]; then
  note "removing the timer (the site keeps running; deploys go back to manual)"
  act systemctl disable --now p91-auto-deploy.timer
  act rm -f "$SERVICE" "$TIMER"
  act systemctl daemon-reload
  note "done"
  exit 0
fi

[[ -d "$REPO_DIR/.git" ]] || die "$REPO_DIR is not a Git checkout (set P91_REPO_DIR)"

HERE="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$HERE/auto-deploy.sh" ]] || die "auto-deploy.sh not found next to this script"

service_unit="[Unit]
Description=P91 Car Care — deploy origin/main when it changes
Documentation=https://github.com/hpalrecha/CarCareBooker
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
# A deploy rebuilds every image and can take ~30 minutes; do not kill it early.
TimeoutStartSec=3600
Environment=P91_REPO_DIR=$REPO_DIR
Environment=P91_DEPLOY_STATE_DIR=$STATE_DIR
Environment=P91_PUBLIC_URL=$PUBLIC_URL
ExecStart=$SCRIPT_PATH --execute
"

timer_unit="[Unit]
Description=P91 Car Care — check origin/main for a new commit

[Timer]
OnBootSec=2min
OnUnitActiveSec=$INTERVAL
# Skipped runs (host asleep, reboot) happen once on the next start, not all at once.
Persistent=true
Unit=p91-auto-deploy.service

[Install]
WantedBy=timers.target
"

note "interval: $INTERVAL   repo: $REPO_DIR   script: $SCRIPT_PATH"
if [[ "$EXECUTE" != "1" ]]; then
  note "would write $SERVICE:"; printf '%s\n' "$service_unit"
  note "would write $TIMER:";   printf '%s\n' "$timer_unit"
  note "run again with --execute to install"
  exit 0
fi

install -d -m 700 "$STATE_DIR/bin"
install -m 700 "$HERE/auto-deploy.sh" "$SCRIPT_PATH"
printf '%s' "$service_unit" > "$SERVICE"
printf '%s' "$timer_unit" > "$TIMER"
chmod 644 "$SERVICE" "$TIMER"
systemctl daemon-reload
systemctl enable --now p91-auto-deploy.timer

note "installed. Next run:"
systemctl list-timers p91-auto-deploy.timer --no-pager || true
note "watch a deploy: journalctl -u p91-auto-deploy -f"
note "pause deploys:  sudo touch $STATE_DIR/auto-deploy.disabled"
