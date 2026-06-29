#!/usr/bin/env bash
# Sprite Animation Editor — macOS / Linux launcher
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js not found in PATH."
  echo "  Install from https://nodejs.org/ (LTS recommended)"
  exit 1
fi

echo "[sprite-anim] Node found, starting server..."
echo
exec node "$(dirname "$0")/sprite-anim-server.mjs"
