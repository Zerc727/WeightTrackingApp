#!/usr/bin/env bash
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO="Zerc727/WeightTrackingApp"
SERVICE_NAME="weight-tracker"

echo "=== WeightTracker Update ==="
echo "App directory: $APP_DIR"
echo ""

# ── Checks ────────────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Run with sudo: sudo $0"
  exit 1
fi

if ! command -v curl &>/dev/null; then
  echo "ERROR: curl is required but not installed."
  exit 1
fi

# ── Fetch latest release ──────────────────────────────────────────────────────

echo "→ Checking for latest release..."
API_RESPONSE=$(curl -sf "https://api.github.com/repos/${REPO}/releases/latest")
LATEST=$(echo "$API_RESPONSE" | grep '"tag_name"' | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

if [ -z "$LATEST" ]; then
  echo "ERROR: Could not fetch latest release from GitHub."
  exit 1
fi

CURRENT=""
if [ -f "$APP_DIR/VERSION" ]; then
  CURRENT=$(cat "$APP_DIR/VERSION")
fi

echo "  Current version : ${CURRENT:-unknown}"
echo "  Latest version  : $LATEST"
echo ""

if [ "$CURRENT" = "$LATEST" ]; then
  echo "Already on the latest version. Nothing to do."
  exit 0
fi

# ── Download ──────────────────────────────────────────────────────────────────

TARBALL="weight-tracker-${LATEST}.tar.gz"
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "→ Downloading $TARBALL..."
curl -L -o "$TMPDIR/$TARBALL" "https://github.com/${REPO}/releases/download/${LATEST}/${TARBALL}"

echo "→ Extracting..."
tar -xzf "$TMPDIR/$TARBALL" -C "$TMPDIR"
NEW_DIR="$TMPDIR/weight-tracker-${LATEST}"

# ── Backup data and config ────────────────────────────────────────────────────

echo "→ Backing up database and config..."
[ -d "$APP_DIR/server/data" ] && cp -r "$APP_DIR/server/data" "$TMPDIR/data_backup"
[ -f "$APP_DIR/server/.env" ] && cp "$APP_DIR/server/.env" "$TMPDIR/env_backup"

# ── Stop service ──────────────────────────────────────────────────────────────

if command -v systemctl &>/dev/null && systemctl is-active "$SERVICE_NAME" &>/dev/null; then
  echo "→ Stopping service..."
  systemctl stop "$SERVICE_NAME"
fi

# ── Replace app files ─────────────────────────────────────────────────────────

echo "→ Installing new files..."
rm -rf "$APP_DIR/server" "$APP_DIR/client" "$APP_DIR/scripts"
cp -r "$NEW_DIR/server" "$APP_DIR/"
cp -r "$NEW_DIR/client" "$APP_DIR/"
cp -r "$NEW_DIR/scripts" "$APP_DIR/"
[ -f "$NEW_DIR/ecosystem.config.js" ] && cp "$NEW_DIR/ecosystem.config.js" "$APP_DIR/"
cp "$NEW_DIR/README.md" "$APP_DIR/"
chmod +x "$APP_DIR/scripts/"*.sh

# ── Restore data and config ───────────────────────────────────────────────────

echo "→ Restoring database and config..."
[ -d "$TMPDIR/data_backup" ] && cp -r "$TMPDIR/data_backup" "$APP_DIR/server/data"
[ -f "$TMPDIR/env_backup"  ] && cp "$TMPDIR/env_backup" "$APP_DIR/server/.env"

# ── Run setup (installs deps, migrates, restarts service) ─────────────────────

"$APP_DIR/scripts/setup.sh"

# ── Record version ────────────────────────────────────────────────────────────

echo "$LATEST" > "$APP_DIR/VERSION"

echo ""
echo "=== Update complete! Now running $LATEST ==="
