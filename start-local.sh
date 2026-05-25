#!/bin/zsh

set -e

ROOT_DIR="/Users/a1234/Desktop/my-projects/todo-mcp-demo"

echo "启动后端服务..."
osascript <<EOF
tell application "Terminal"
  do script "cd '$ROOT_DIR/server' && npm run dev"
end tell
EOF

echo "启动前端服务..."
osascript <<EOF
tell application "Terminal"
  do script "cd '$ROOT_DIR/client' && npm run dev -- --host 127.0.0.1"
end tell
EOF

echo ""
echo "本地服务已在新的终端窗口中启动："
echo "前端: http://127.0.0.1:5173"
echo "后端: http://localhost:3000"
echo "MCP:  http://localhost:3000/mcp"
