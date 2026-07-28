#!/usr/bin/env bash
#
# Wipes all tracked entries from the Nasr database and leaves the install in
# place. Your PIN, targets and dates survive; everything you have logged does
# not. A consistent backup is written before anything is deleted.
#
set -euo pipefail

# Set once the service has been stopped, cleared once it is back up. The EXIT
# trap uses it so a failure part-way through can never leave the app down.
SERVICE_WAS_ACTIVE=0

restore_service() {
  if [ "$SERVICE_WAS_ACTIVE" -eq 1 ]; then
    SERVICE_WAS_ACTIVE=0
    echo ""
    echo "Starting nasr..."
    sudo systemctl start nasr || echo "reset.sh: could not restart nasr — start it manually." >&2
  fi
}

trap 'rc=$?; echo "" >&2; echo "reset.sh: FAILED at line $LINENO (exit $rc)" >&2' ERR
trap restore_service EXIT

INSTALL_DIR="${NASR_INSTALL_DIR:-/opt/nasr}"
ASSUME_YES=0

usage() {
  cat <<'USAGE'
Usage: reset.sh [-y|--yes]

Deletes every logged entry (deen days, opportunities, touches, observations,
sadaqah, sessions) and keeps your PIN and settings.

  -y, --yes   Skip the confirmation prompt.
  -h, --help  Show this message.

Environment:
  NASR_INSTALL_DIR  Install root to operate on (default: /opt/nasr).

A backup is written to <install>/backups/pre-reset-<timestamp>.db first.
To undo: stop the service, copy that file over data/nasr.db, start again.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; echo "" >&2; usage >&2; exit 1 ;;
  esac
done

if [ ! -d "$INSTALL_DIR/apps/web" ]; then
  echo "No Nasr install at $INSTALL_DIR (expected $INSTALL_DIR/apps/web)." >&2
  echo "Set NASR_INSTALL_DIR if it lives elsewhere." >&2
  exit 1
fi

# The installer writes .env as the single source of truth for runtime config;
# read the DB path from it so this script and the service always agree.
if [ -f "$INSTALL_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$INSTALL_DIR/.env"
  set +a
fi
DB_PATH="${NASR_DB_PATH:-$INSTALL_DIR/data/nasr.db}"

if [ ! -f "$DB_PATH" ]; then
  echo "No database at $DB_PATH — nothing to reset." >&2
  exit 1
fi

# better-sqlite3 is a dependency of the web workspace, so it does not resolve
# from the repo root.
WEB_DIR="$INSTALL_DIR/apps/web"

echo "=== Nasr Reset ==="
echo "Database: $DB_PATH"
echo ""
echo "Current contents:"
(cd "$WEB_DIR" && NASR_DB_PATH="$DB_PATH" node -e "
  const Database = require('better-sqlite3');
  const db = new Database(process.env.NASR_DB_PATH, { readonly: true });
  const tables = ['deen_days', 'opportunities', 'touches', 'observations', 'sadaqah_log', 'sessions'];
  for (const t of tables) {
    const n = db.prepare('SELECT COUNT(*) AS c FROM ' + t).get().c;
    console.log('  ' + t.padEnd(16) + String(n).padStart(6) + ' rows');
  }
  db.close();
")
echo ""
echo "Settings and your PIN will be kept. Everything above will be deleted."

if [ "$ASSUME_YES" -eq 0 ]; then
  echo ""
  read -rp "Type RESET to confirm: " reply
  if [ "$reply" != "RESET" ]; then
    echo "Aborted; nothing was changed."
    exit 1
  fi
fi

# Stop the service so nothing writes mid-reset. Remember whether it was running
# so a dev-box run (no systemd unit) does not try to start one.
if command -v systemctl &>/dev/null && systemctl is-active --quiet nasr 2>/dev/null; then
  SERVICE_WAS_ACTIVE=1
  echo ""
  echo "Stopping nasr..."
  sudo systemctl stop nasr
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$INSTALL_DIR/backups/pre-reset-$TIMESTAMP.db"

# An install whose backup timer ran as root leaves this directory root-owned,
# so the app user cannot write into it. Take ownership rather than fail.
mkdir -p "$INSTALL_DIR/backups" 2>/dev/null || true
if [ ! -w "$INSTALL_DIR/backups" ]; then
  echo "Backups directory is not writable; taking ownership (needs sudo)..."
  sudo mkdir -p "$INSTALL_DIR/backups"
  sudo chown -R "$(id -un)":"$(id -gn)" "$INSTALL_DIR/backups"
fi

echo "Backing up to $BACKUP_PATH..."
(cd "$WEB_DIR" && NASR_DB_PATH="$DB_PATH" NASR_BACKUP_PATH="$BACKUP_PATH" node -e "
  const Database = require('better-sqlite3');
  const db = new Database(process.env.NASR_DB_PATH);
  // VACUUM INTO writes a consistent snapshot including anything still sitting
  // in the -wal file, which a plain cp of the .db would miss.
  db.prepare('VACUUM INTO ?').run(process.env.NASR_BACKUP_PATH);
  db.close();
")

echo "Deleting entries..."
(cd "$WEB_DIR" && NASR_DB_PATH="$DB_PATH" node -e "
  const Database = require('better-sqlite3');
  const db = new Database(process.env.NASR_DB_PATH);
  db.pragma('foreign_keys = ON');
  // Children before parents: touches reference opportunities.
  const tables = ['touches', 'opportunities', 'observations', 'deen_days', 'sadaqah_log', 'sessions'];
  const wipe = db.transaction(() => {
    for (const t of tables) {
      const r = db.prepare('DELETE FROM ' + t).run();
      console.log('  ' + t.padEnd(16) + String(r.changes).padStart(6) + ' deleted');
    }
    // Transient auth state, not user settings: a stale lockout would otherwise
    // outlive the reset and lock you out of an empty app.
    db.prepare(\"DELETE FROM settings WHERE key IN ('failed_attempts', 'lockout_until')\").run();
  });
  wipe();
  db.exec('VACUUM');
  const kept = db.prepare('SELECT key FROM settings ORDER BY key').all().map((r) => r.key);
  console.log('');
  console.log('  kept settings: ' + kept.join(', '));
  db.close();
")

restore_service

echo ""
echo "=== Reset complete ==="
echo "Backup: $BACKUP_PATH"
echo "To undo: sudo systemctl stop nasr && cp '$BACKUP_PATH' '$DB_PATH' && rm -f '$DB_PATH-wal' '$DB_PATH-shm' && sudo systemctl start nasr"
echo ""
