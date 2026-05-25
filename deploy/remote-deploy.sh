#!/usr/bin/env bash

set -euo pipefail

if [ "${1:-}" = "" ] || [ "${2:-}" = "" ]; then
  echo "Usage: bash deploy/remote-deploy.sh <deploy_path> <release_sha>"
  exit 1
fi

DEPLOY_PATH="$1"
RELEASE_SHA="$2"
RELEASE_DIR="$DEPLOY_PATH/releases/$RELEASE_SHA"
CURRENT_LINK="$DEPLOY_PATH/current"
SHARED_DIR="$DEPLOY_PATH/shared"

echo "==> Deploy path: $DEPLOY_PATH"
echo "==> Release: $RELEASE_SHA"

mkdir -p "$DEPLOY_PATH/releases" "$SHARED_DIR/server" "$SHARED_DIR/client"

if [ ! -f "$SHARED_DIR/server/.env" ]; then
  echo "Missing shared server env: $SHARED_DIR/server/.env"
  exit 1
fi

if [ ! -f "$SHARED_DIR/client/.env" ]; then
  echo "Missing shared client env: $SHARED_DIR/client/.env"
  exit 1
fi

cd "$RELEASE_DIR"

ln -sfn "$SHARED_DIR/server/.env" server/.env
ln -sfn "$SHARED_DIR/client/.env" client/.env

echo "==> Installing server dependencies"
cd "$RELEASE_DIR/server"
npm ci
npm run prisma:generate
npm run prisma:push
npm run build

echo "==> Installing client dependencies"
cd "$RELEASE_DIR/client"
npm ci
npm run build

echo "==> Switching current release"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

cd "$CURRENT_LINK"

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q '^todo-list-mcp\.service'; then
  echo "==> Restarting systemd service"
  sudo systemctl restart todo-list-mcp
  sudo systemctl status todo-list-mcp --no-pager --lines=20
elif command -v pm2 >/dev/null 2>&1; then
  echo "==> Restarting PM2 app"
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save
else
  echo "No supported process manager found. Please install systemd service or PM2."
  exit 1
fi

echo "==> Deploy completed"
