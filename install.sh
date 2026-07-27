#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/nasr"
SERVICE_USER="${NASR_USER:-$(whoami)}"

echo "=== Nasr Installer ==="

# 1. Node.js 22
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  echo "Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node.js $(node -v)"

# 2. pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  sudo npm install -g pnpm
fi
echo "pnpm $(pnpm -v)"

# 3. Copy project files
echo "Setting up $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"
sudo chown "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"
rsync -a --exclude node_modules --exclude .output --exclude data --exclude backups ./ "$INSTALL_DIR/"

cd "$INSTALL_DIR"

# 4. Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 5. Run migrations
echo "Running database migrations..."
mkdir -p data
pnpm db:migrate

# 6. Set PIN
if [ -z "${NASR_PIN:-}" ]; then
  echo ""
  read -rsp "Set your PIN (min 4 chars): " pin
  echo ""
  if [ ${#pin} -lt 4 ]; then
    echo "PIN must be at least 4 characters."
    exit 1
  fi
else
  pin="$NASR_PIN"
  echo "Using PIN from NASR_PIN environment variable."
fi

# Set PIN via API bootstrap
node -e "
  const Database = require('better-sqlite3');
  const crypto = require('crypto');
  const db = new Database('$INSTALL_DIR/data/nasr.db');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync('$pin', salt, 64).toString('hex');
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('pin_hash', salt + ':' + hash);
  db.close();
  console.log('PIN set successfully.');
"

# 7. Build
echo "Building..."
pnpm build

# 8. Install systemd units
echo "Installing systemd services..."
sudo cp "$INSTALL_DIR/nasr.service" /etc/systemd/system/
sudo cp "$INSTALL_DIR/nasr-backup.service" /etc/systemd/system/
sudo cp "$INSTALL_DIR/nasr-backup.timer" /etc/systemd/system/

# Update user in service file
sudo sed -i "s/User=rehan/User=$SERVICE_USER/" /etc/systemd/system/nasr.service

sudo systemctl daemon-reload
sudo systemctl enable --now nasr.service
sudo systemctl enable --now nasr-backup.timer

echo ""
echo "=== Nasr is running! ==="
echo "Open http://$(hostname -I | awk '{print $1}'):8080 in your browser."
echo ""
