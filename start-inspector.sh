#!/bin/zsh

set -e

INSPECTOR_TOKEN="todo-inspector-local"
CLIENT_PORT="6274"
SERVER_PORT="6277"
SERVER_URL="http://localhost:3000/mcp"

echo "启动 MCP Inspector..."
echo ""
echo "打开下面这个地址："
echo "http://localhost:${CLIENT_PORT}/?MCP_PROXY_AUTH_TOKEN=${INSPECTOR_TOKEN}&transport=streamable-http&serverUrl=${SERVER_URL}"
echo ""
echo "在 Inspector 页面里补充："
echo "1. Authorization: Bearer 你的 todo_mcp_token"
echo "2. 如果它没有自动带上，再补："
echo "   Accept: text/event-stream, application/json"
echo "   Content-Type: application/json"
echo ""

MCP_PROXY_AUTH_TOKEN="${INSPECTOR_TOKEN}" \
CLIENT_PORT="${CLIENT_PORT}" \
SERVER_PORT="${SERVER_PORT}" \
MCP_AUTO_OPEN_ENABLED=false \
npx @modelcontextprotocol/inspector
