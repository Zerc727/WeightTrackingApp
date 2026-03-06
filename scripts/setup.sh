#!/usr/bin/env bash
set -e

# Resolve the app root (one level above this script)
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="weight-tracker"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "=== WeightTracker Setup ==="
echo "App directory: $APP_DIR"
echo ""

# ── Checks ────────────────────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node.js 18+ first."
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required (found v$NODE_VERSION)."
  exit 1
fi

# ── Location check (systemd service user cannot access home directories) ──────

if [[ "$APP_DIR" == /home/* || "$APP_DIR" == /root/* ]]; then
  echo "ERROR: App is installed in '$APP_DIR'."
  echo "  The systemd service user cannot access home or root directories."
  echo "  Please clone the app to /opt/WeightTrackingApp instead:"
  echo ""
  echo "    sudo git clone https://github.com/zercsy/WeightTrackingApp.git /opt/WeightTrackingApp"
  echo "    cd /opt/WeightTrackingApp && sudo ./scripts/setup.sh"
  echo ""
  exit 1
fi

# ── Server deps ───────────────────────────────────────────────────────────────

echo "→ Installing server dependencies..."
cd "$APP_DIR/server"
npm install --omit=dev

# Setup .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed -i "s/change_me_to_a_long_random_string/$SECRET/" .env
  echo "→ Created server/.env with generated JWT secret"
fi

# Create data dir
mkdir -p data

# Run migrations + seed
echo "→ Running database migrations..."
npm run migrate

# ── Client build ──────────────────────────────────────────────────────────────

echo "→ Installing client dependencies..."
cd "$APP_DIR/client"
npm install

echo "→ Building frontend..."
npm run build

cd "$APP_DIR"

# ── Systemd installation ──────────────────────────────────────────────────────

install_systemd_service() {
  echo ""
  echo "→ Installing systemd service..."

  NODE_BIN=$(command -v node)

  # Create a dedicated system user if it doesn't exist
  if ! id -u "$SERVICE_NAME" &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_NAME"
    echo "  Created system user: $SERVICE_NAME"
  fi

  # Give the service user ownership of the app directory
  chown -R "${SERVICE_NAME}:${SERVICE_NAME}" "$APP_DIR"

  # Write the service file
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Weight Tracker App
Documentation=https://github.com/your-repo/WeightTrackingApp
After=network.target

[Service]
Type=simple
User=${SERVICE_NAME}
Group=${SERVICE_NAME}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/server/.env
ExecStart=${NODE_BIN} server/src/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

# Harden the service
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=${APP_DIR}/server/data

[Install]
WantedBy=multi-user.target
EOF

  echo "  Service file written to: $SERVICE_FILE"

  # Reload systemd and enable + start the service
  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"
  systemctl restart "$SERVICE_NAME"

  echo ""
  echo "=== Systemd service installed and started! ==="
  echo ""
  systemctl status "$SERVICE_NAME" --no-pager -l || true
  echo ""
  echo "Useful commands:"
  echo "  sudo systemctl status $SERVICE_NAME"
  echo "  sudo systemctl restart $SERVICE_NAME"
  echo "  sudo systemctl stop $SERVICE_NAME"
  echo "  sudo journalctl -u $SERVICE_NAME -f"
}

reinstall_systemd_service() {
  echo ""
  echo "→ Updating systemd service (app already installed)..."

  NODE_BIN=$(command -v node)

  # Update ownership in case new files were added
  chown -R "${SERVICE_NAME}:${SERVICE_NAME}" "$APP_DIR"

  # Rewrite service file (path or node binary may have changed)
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Weight Tracker App
After=network.target

[Service]
Type=simple
User=${SERVICE_NAME}
Group=${SERVICE_NAME}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/server/.env
ExecStart=${NODE_BIN} server/src/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=${APP_DIR}/server/data

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl restart "$SERVICE_NAME"
  echo "  Service restarted."
}

# ── Systemd decision logic ────────────────────────────────────────────────────

if ! command -v systemctl &>/dev/null; then
  # Not Linux / systemd not available
  echo ""
  echo "=== Setup complete! (systemd not available on this system) ==="
  echo ""
  echo "To start the app:"
  echo "  cd $APP_DIR/server && node src/index.js"
  echo ""
  echo "Default login: admin / admin123 (you will be forced to change it)"
  exit 0
fi

if [ "$EUID" -ne 0 ]; then
  # Not running as root — print instructions
  echo ""
  echo "=== Build complete! ==="
  echo ""
  echo "To install as a systemd service, re-run with sudo:"
  echo "  sudo $0"
  echo ""
  echo "Or to start manually:"
  echo "  NODE_ENV=production node $APP_DIR/server/src/index.js"
  echo ""
  echo "Default login: admin / admin123 (you will be forced to change it)"
  exit 0
fi

# Running as root with systemd available
if [ -f "$SERVICE_FILE" ]; then
  reinstall_systemd_service
else
  install_systemd_service
fi

echo ""
echo "App is running at: http://localhost:3000"
echo "Default login: admin / admin123 (you will be forced to change it on first login)"
