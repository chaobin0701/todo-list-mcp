#!/usr/bin/env bash

set -euo pipefail

APP_NAME="todo-list-mcp"
DEPLOY_ROOT="/opt/${APP_NAME}"
DEPLOY_USER="${1:-deploy}"

echo "==> Preparing server directories"
sudo mkdir -p "$DEPLOY_ROOT/releases" "$DEPLOY_ROOT/shared/server" "$DEPLOY_ROOT/shared/client"
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_ROOT"

echo "==> Suggested server env path"
echo "$DEPLOY_ROOT/shared/server/.env"

echo "==> Suggested client env path"
echo "$DEPLOY_ROOT/shared/client/.env"

echo "==> If PM2 is not installed, run:"
echo "npm install -g pm2"

echo "==> If Nginx is not installed, run:"
echo "sudo apt update && sudo apt install -y nginx"

echo "==> Preparation completed"
