<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import DashboardShell from '../components/DashboardShell.vue'
import { createMcpToken, fetchMcpTokens, revokeMcpToken, type McpTokenRecord } from '../api/mcpTokens'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const serverUrl = import.meta.env.VITE_MCP_SERVER_URL ?? 'http://localhost:3000/mcp'

const navItems = [
  { label: 'Todo', to: '/todos', icon: '☰' },
  { label: 'MCP Settings', to: '/mcp-settings', icon: '</>' },
]

const searchKeyword = ref('')
const tokens = ref<McpTokenRecord[]>([])
const loading = ref(false)
const creating = ref(false)
const revokingId = ref<string | null>(null)
const newTokenName = ref('我的 Codex 连接')
const latestPlainToken = ref('')
const statusMessage = ref('')
const errorMessage = ref('')
const backendPending = ref(false)

const availableTools = [
  { name: 'list_todos', description: 'List and search todos', dangerous: false },
  { name: 'create_todo', description: 'Create a new todo', dangerous: false },
  { name: 'update_todo', description: 'Update an existing todo', dangerous: false },
  { name: 'complete_todo', description: 'Mark a todo as completed', dangerous: false },
  { name: 'delete_todo', description: 'Delete a todo and require confirmation', dangerous: true },
]

const tokenCount = computed(() => tokens.value.length)
const usedCount = computed(() => tokens.value.filter((token) => token.lastUsedAt).length)
const filteredTokens = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return tokens.value
  }

  return tokens.value.filter((token) => {
    return (
      token.name.toLowerCase().includes(keyword) ||
      token.scopes.join(' ').toLowerCase().includes(keyword)
    )
  })
})

const filteredTools = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return availableTools
  }

  return availableTools.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(keyword) ||
      tool.description.toLowerCase().includes(keyword)
    )
  })
})

const codexConfig = computed(() => {
  const tokenValue = latestPlainToken.value || 'todo_mcp_xxxxx'

  return `[mcp_servers.todo_demo]
url = "${serverUrl}"
default_tools_approval_mode = "prompt"

[mcp_servers.todo_demo.http_headers]
Authorization = "Bearer ${tokenValue}"
Accept = "text/event-stream, application/json"
Content-Type = "application/json"
`
})

async function loadTokens() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchMcpTokens()
    tokens.value = response.data
    backendPending.value = false
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 501) {
      backendPending.value = true
      tokens.value = []
      return
    }

    errorMessage.value = '加载 MCP Token 失败'
  } finally {
    loading.value = false
  }
}

async function handleCreateToken() {
  creating.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const response = await createMcpToken({
      name: newTokenName.value.trim() || '我的 Codex 连接',
    })
    latestPlainToken.value = response.data.token ?? ''
    statusMessage.value = latestPlainToken.value
      ? '新的 Token 已创建，明文只展示这一次。'
      : 'Token 创建成功。'
    await loadTokens()
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '创建 Token 失败'
      return
    }

    errorMessage.value = '创建 Token 失败'
  } finally {
    creating.value = false
  }
}

async function handleRevokeToken(id: string) {
  if (!window.confirm('确认撤销这个 Token 吗？撤销后现有 MCP 连接会立即失效。')) {
    return
  }

  revokingId.value = id
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await revokeMcpToken(id)
    statusMessage.value = 'Token 已撤销。'
    await loadTokens()
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '撤销 Token 失败'
      return
    }

    errorMessage.value = '撤销 Token 失败'
  } finally {
    revokingId.value = null
  }
}

async function copyText(value: string, successMessage: string) {
  await navigator.clipboard.writeText(value)
  statusMessage.value = successMessage
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '从未使用'
}

async function handleLogout() {
  authStore.clearSession()
  await router.push('/login')
}

onMounted(() => {
  loadTokens()
})
</script>

<template>
  <DashboardShell
    v-model:search-value="searchKeyword"
    :endpoint-value="serverUrl"
    endpoint-label="MCP Endpoint"
    :nav-items="navItems"
    search-placeholder="Search tools or tokens..."
    :subtitle="'Securely expose your Todo data and tools via MCP.'"
    title="MCP Settings"
    :user-name="authStore.user?.name || authStore.user?.email"
  >
    <template #sidebar-extra>
      <div class="sidebar-card">
        <p>当前登录</p>
        <strong>{{ authStore.user?.name || '未设置昵称' }}</strong>
        <span>{{ authStore.user?.email }}</span>
        <button type="button" @click="handleLogout">退出登录</button>
      </div>
    </template>

    <section class="status-banner">
      <div class="status-badge">✓</div>
      <div>
        <strong>MCP is enabled</strong>
        <p>你的端点已经可用，可以接受 Codex 和其他 MCP 客户端的连接请求。</p>
      </div>
      <div class="endpoint-block">
        <span>Your MCP Endpoint</span>
        <div>
          <code>{{ serverUrl }}</code>
          <button type="button" @click="copyText(serverUrl, 'MCP 地址已复制。')">复制</button>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel-card">
        <h2>1. Token Management</h2>
        <p class="panel-copy">你的 MCP Token 用于认证访问当前端点的请求。</p>

        <label class="field">
          <span>Token 名称</span>
          <input v-model="newTokenName" type="text" maxlength="50" placeholder="例如：本地 Codex 调试" />
        </label>

        <label class="field">
          <span>Current Token</span>
          <div class="secret-row">
            <input :value="latestPlainToken || '••••••••••••••••••••••••••••••'" readonly type="text" />
            <button
              type="button"
              :disabled="!latestPlainToken"
              @click="copyText(latestPlainToken, 'Token 已复制。')"
            >
              Copy
            </button>
          </div>
        </label>

        <div class="button-row">
          <button class="primary-button" type="button" :disabled="creating" @click="handleCreateToken">
            {{ creating ? '生成中...' : 'Generate New Token' }}
          </button>
        </div>

        <p class="warning-note">请妥善保管 Token。任何持有 Token 的客户端都能访问你的 Todo 数据。</p>
      </article>

      <article class="panel-card">
        <h2>2. Connect from Codex</h2>
        <p class="panel-copy">将这段配置复制到你的 Codex MCP 设置中。</p>
        <pre class="config-preview">{{ codexConfig }}</pre>
        <button class="ghost-button" type="button" @click="copyText(codexConfig, 'Codex 配置已复制。')">
          Copy Config
        </button>
      </article>

      <article class="panel-card">
        <h2>3. Available MCP Tools</h2>
        <p class="panel-copy">这些工具会通过 MCP 暴露给已授权客户端。</p>
        <ul class="tool-list">
          <li v-for="tool in filteredTools" :key="tool.name" :class="{ danger: tool.dangerous }">
            <div class="tool-title">
              <span class="dot"></span>
              <strong>{{ tool.name }}</strong>
              <em v-if="tool.dangerous">Dangerous</em>
            </div>
            <p>{{ tool.description }}</p>
          </li>
        </ul>
      </article>
    </section>

    <section class="lower-grid">
      <article class="wide-card">
        <div class="section-head">
          <div>
            <h2>4. Recent Token Records</h2>
            <p>当前项目以 Token 记录为主，展示创建时间和最近使用时间。</p>
          </div>
          <div class="record-stats">
            <span>{{ tokenCount }} Tokens</span>
            <span>{{ usedCount }} Used</span>
          </div>
        </div>

        <p v-if="statusMessage" class="message success">{{ statusMessage }}</p>
        <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        <div v-if="loading" class="state-panel">正在加载 Token...</div>
        <div v-else-if="backendPending" class="state-panel">后端 Token 接口暂不可用。</div>
        <div v-else-if="filteredTokens.length === 0" class="state-panel">当前没有匹配的 Token 记录。</div>
        <ul v-else class="token-list">
          <li v-for="token in filteredTokens" :key="token.id">
            <div>
              <strong>{{ token.name }}</strong>
              <p>Scopes: {{ token.scopes.join(', ') }}</p>
              <small>创建于 {{ formatTime(token.createdAt) }}</small>
              <small>最后使用 {{ formatTime(token.lastUsedAt) }}</small>
            </div>
            <button type="button" class="danger-button" :disabled="revokingId === token.id" @click="handleRevokeToken(token.id)">
              {{ revokingId === token.id ? '撤销中...' : 'Revoke' }}
            </button>
          </li>
        </ul>
      </article>

      <article class="safety-card">
        <h2>5. Safety & Guardrails</h2>
        <div class="guard-item">
          <strong>Dangerous actions require confirmation</strong>
          <p>`delete_todo` 需要显式确认，客户端支持时也应弹出危险操作确认。</p>
        </div>
        <div class="guard-item">
          <strong>Least-privilege access</strong>
          <p>Token 只作用于当前用户的数据空间，不会越权访问其他用户待办。</p>
        </div>
        <div class="guard-item">
          <strong>You’re in control</strong>
          <p>你可以随时撤销 Token，让现有 MCP 连接立刻失效。</p>
        </div>
        <a href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer">Learn more about MCP</a>
      </article>
    </section>
  </DashboardShell>
</template>

<style>
.sidebar-card {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
}

.sidebar-card p,
.sidebar-card span {
  margin: 0;
  color: #6e7992;
}

.sidebar-card strong {
  color: #1d2742;
}

.sidebar-card button,
.ghost-button,
.primary-button,
.danger-button,
.secret-row button,
.endpoint-block button {
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
}

.sidebar-card button {
  margin-top: 8px;
  padding: 10px 12px;
  color: #314163;
  background: rgba(46, 87, 255, 0.08);
}

.status-banner,
.panel-card,
.wide-card,
.safety-card {
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 34px rgba(31, 46, 87, 0.05);
}

.status-banner {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) minmax(320px, 420px);
  gap: 20px;
  align-items: center;
  padding: 22px;
}

.status-badge {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  color: #1da64e;
  font-size: 1.6rem;
  background: rgba(29, 166, 78, 0.12);
}

.status-banner strong {
  display: block;
  color: #1c8f43;
  font-size: 1.5rem;
}

.status-banner p {
  margin: 8px 0 0;
  color: #67748f;
}

.endpoint-block span,
.field span {
  display: block;
  margin-bottom: 8px;
  color: #6a7691;
  font-size: 0.9rem;
}

.endpoint-block div,
.secret-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.endpoint-block code,
.secret-row input,
.field input,
.config-preview {
  width: 100%;
  border: 1px solid rgba(36, 52, 89, 0.1);
  border-radius: 14px;
  padding: 13px 14px;
  color: #26324f;
  background: #fbfcff;
}

.endpoint-block button,
.secret-row button,
.ghost-button {
  padding: 12px 14px;
  color: #2f56ff;
  background: rgba(47, 86, 255, 0.08);
}

.content-grid,
.lower-grid {
  display: grid;
  gap: 18px;
}

.content-grid {
  grid-template-columns: 1.1fr 1fr 1fr;
}

.lower-grid {
  grid-template-columns: 1.4fr 0.9fr;
}

.panel-card,
.wide-card,
.safety-card {
  padding: 22px;
}

.panel-card h2,
.wide-card h2,
.safety-card h2 {
  margin: 0;
  color: #17203a;
  font-size: 1.3rem;
}

.panel-copy,
.section-head p,
.tool-list p,
.guard-item p {
  margin: 8px 0 0;
  color: #6d7994;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.field input:focus,
.secret-row input:focus {
  outline: none;
  border-color: rgba(47, 86, 255, 0.35);
  box-shadow: 0 0 0 4px rgba(47, 86, 255, 0.08);
}

.button-row {
  margin-top: 16px;
}

.primary-button {
  padding: 13px 16px;
  color: #ffffff;
  background: linear-gradient(135deg, #2f56ff 0%, #5b70ff 100%);
}

.warning-note {
  margin: 16px 0 0;
  padding: 14px;
  border-radius: 16px;
  color: #b06b00;
  background: #fff7ea;
}

.config-preview {
  margin: 18px 0 14px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'SFMono-Regular', ui-monospace, monospace;
}

.tool-list,
.token-list {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.tool-list li,
.token-list li,
.guard-item {
  padding: 16px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 18px;
  background: #fbfcff;
}

.tool-list li.danger {
  border-color: rgba(255, 79, 120, 0.22);
  background: #fff7f9;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-title strong {
  color: #1e2945;
}

.tool-title em {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 999px;
  color: #ff476f;
  font-size: 0.78rem;
  font-style: normal;
  background: rgba(255, 71, 111, 0.12);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #18b05d;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.record-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.record-stats span {
  padding: 8px 10px;
  border-radius: 999px;
  color: #51607d;
  background: #f4f7fc;
  font-size: 0.88rem;
}

.message {
  margin: 16px 0 0;
  padding: 13px 14px;
  border-radius: 16px;
}

.success {
  color: #17663b;
  background: #eef9f1;
}

.error {
  color: #a22f40;
  background: #fff2f4;
}

.state-panel {
  margin-top: 18px;
  padding: 24px 16px;
  border-radius: 18px;
  color: #6b7894;
  background: #f7f9fd;
}

.token-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.token-list p,
.token-list small {
  display: block;
  margin-top: 6px;
  color: #6f7c97;
}

.danger-button {
  padding: 11px 13px;
  color: #de2c5d;
  background: #fff2f5;
}

.guard-item + .guard-item {
  margin-top: 12px;
}

.safety-card a {
  display: inline-block;
  margin-top: 16px;
  color: #2f56ff;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 1280px) {
  .content-grid,
  .lower-grid,
  .status-banner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .endpoint-block div,
  .secret-row,
  .token-list li,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
