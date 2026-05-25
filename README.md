# todo-mcp-demo

一个把 Todo Web 应用和远程 MCP Server 打通的演示项目。  
用户可以先在网页里注册、登录、管理自己的待办，再生成 MCP Token，把同一份 Todo 数据开放给 Codex 等 MCP 客户端读取和操作。

## 核心能力

- 邮箱 + 密码注册登录
- Todo 创建、查看、搜索、筛选、编辑、完成、删除
- MCP Token 生成、查看、撤销
- MCP Server 工具调用
- 删除类工具需要显式确认

当前 MCP 工具包括：

- `list_todos`
- `create_todo`
- `update_todo`
- `complete_todo`
- `delete_todo`

## 技术栈

- 前端：Vue 3 + Vite + TypeScript + Pinia + Vue Router
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite + Prisma
- MCP：`@modelcontextprotocol/sdk`

## 项目结构

```text
todo-mcp-demo/
├─ client/                # Vue 前端
├─ server/                # Express API + MCP Server
├─ start-local.sh         # 本地同时启动前后端
├─ start-inspector.sh     # 启动 MCP Inspector
└─ README.md
```

## 本地启动

### 1. 启动前端

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 2. 启动后端

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

### 3. 一键启动

```bash
./start-local.sh
```

## 常用地址

- 前端：`http://127.0.0.1:5173`
- 后端健康检查：`http://localhost:3000/health`
- API 健康检查：`http://localhost:3000/api/health`
- MCP 地址：`http://localhost:3000/mcp`
- MCP Inspector：`http://localhost:6274`

## MCP 配置示例

在网页生成 Token 后，可将下面的配置加入 Codex：

```toml
[mcp_servers.todo_demo]
url = "http://localhost:3000/mcp"
default_tools_approval_mode = "prompt"

[mcp_servers.todo_demo.http_headers]
Authorization = "Bearer todo_mcp_xxxxx"
Accept = "text/event-stream, application/json"
Content-Type = "application/json"
```

## 本地冒烟测试

```bash
cd server
npm run smoke:mcp
```

这个脚本会自动：

- 注册测试用户
- 生成 MCP Token
- 连接 `/mcp`
- 调用 `list_todos`
- 调用 `create_todo`
- 调用 `update_todo`
- 调用 `complete_todo`
- 调用 `delete_todo`

## GitHub Actions 自动部署

仓库已包含：

- GitHub Actions 工作流：`.github/workflows/deploy.yml`
- 远程部署脚本：`deploy/remote-deploy.sh`
- PM2 配置：`ecosystem.config.cjs`
- Nginx 示例配置：`deploy/nginx.todo-mcp-demo.conf.example`

### GitHub Secrets

需要在仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`
- `DEPLOY_PATH`

推荐：

- `DEPLOY_HOST=120.26.45.112`
- `DEPLOY_USER=deploy`
- `DEPLOY_PATH=/var/www/todo-mcp-demo`

### 服务器需要提前准备

至少需要这些：

1. 安装 `Node.js 20+`
2. 安装 `pm2`
3. 安装并配置 `nginx`
4. 创建部署目录：

```bash
sudo mkdir -p /var/www/todo-mcp-demo/{releases,shared/server,shared/client}
sudo chown -R deploy:deploy /var/www/todo-mcp-demo
```

5. 准备服务端环境变量文件：

路径：

```bash
/var/www/todo-mcp-demo/shared/server/.env
```

建议内容示例：

```env
NODE_ENV=production
PORT=3000
CLIENT_ORIGIN=https://your-domain.com
DATABASE_URL="file:/var/www/todo-mcp-demo/shared/server/prod.db"
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
```

6. 准备前端环境变量文件：

路径：

```bash
/var/www/todo-mcp-demo/shared/client/.env
```

建议内容示例：

```env
VITE_API_BASE_URL=https://your-domain.com
VITE_MCP_SERVER_URL=https://your-domain.com/mcp
```

7. 安装 PM2：

```bash
npm install -g pm2
```

首次部署完成后可执行：

```bash
pm2 startup
pm2 save
```

## 发布前提醒

- 不要提交 `client/.env` 和 `server/.env`
- 不要提交本地 SQLite 数据库 `server/prisma/dev.db`
- 上线前请替换 `JWT_SECRET`
- 远程 MCP 建议使用 HTTPS
