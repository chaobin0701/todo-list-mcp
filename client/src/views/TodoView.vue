<script setup lang="ts">
import axios from 'axios'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import DashboardShell from '../components/DashboardShell.vue'
import { apiBaseUrl } from '../api/http'
import { createTodo, deleteTodo, fetchTodos, updateTodo, type Todo } from '../api/todos'
import { useAuthStore } from '../stores/auth'

type FilterStatus = 'all' | 'active' | 'completed'
type TodoPriority = 'low' | 'medium' | 'high'

const authStore = useAuthStore()
const router = useRouter()

const navItems = [
  { label: 'Todo', to: '/todos', icon: '☰' },
  { label: 'MCP Settings', to: '/mcp-settings', icon: '</>' },
]

const filters: Array<{ label: string; value: FilterStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
]

const searchKeyword = ref('')
const selectedFilter = ref<FilterStatus>('all')
const todos = ref<Todo[]>([])
const overviewTodos = ref<Todo[]>([])
const loading = ref(false)
const creating = ref(false)
const savingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const statusMessage = ref('')
const errorMessage = ref('')
const composerRef = ref<HTMLInputElement | null>(null)
const form = reactive({
  title: '',
  description: '',
  priority: 'medium' as TodoPriority,
})

let searchTimer: number | undefined

const totalCount = computed(() => overviewTodos.value.length)
const completedCount = computed(() => overviewTodos.value.filter((todo) => todo.completed).length)
const activeCount = computed(() => overviewTodos.value.filter((todo) => !todo.completed).length)
const highPriorityCount = computed(
  () => overviewTodos.value.filter((todo) => !todo.completed && todo.priority === 'high').length,
)

function formatDate(value: string | null) {
  if (!value) {
    return '未设置'
  }

  return new Date(value).toLocaleDateString()
}

function priorityLabel(priority: TodoPriority) {
  return (
    {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    } satisfies Record<TodoPriority, string>
  )[priority]
}

function statusLabel(todo: Todo) {
  return todo.completed ? 'Completed' : selectedFilter.value === 'active' ? 'In Progress' : 'Active'
}

async function loadOverview() {
  const response = await fetchTodos('all')
  overviewTodos.value = response.data
}

async function loadTodos() {
  loading.value = true

  try {
    const response = await fetchTodos(selectedFilter.value, searchKeyword.value.trim() || undefined)
    todos.value = response.data
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  errorMessage.value = ''

  try {
    await Promise.all([loadOverview(), loadTodos()])
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '加载待办失败'
      return
    }

    errorMessage.value = '加载待办失败'
  }
}

async function handleCreateTodo() {
  if (!form.title.trim()) {
    errorMessage.value = '请输入任务标题'
    return
  }

  creating.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await createTodo({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
    })

    form.title = ''
    form.description = ''
    form.priority = 'medium'
    statusMessage.value = '新任务已创建。'
    await refreshData()
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '创建待办失败'
      return
    }

    errorMessage.value = '创建待办失败'
  } finally {
    creating.value = false
  }
}

async function patchTodo(id: string, payload: Record<string, unknown>, successMessage?: string) {
  savingId.value = id
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const response = await updateTodo(id, payload)
    const nextTodo = response.data
    const rowIndex = todos.value.findIndex((todo) => todo.id === id)
    const overviewIndex = overviewTodos.value.findIndex((todo) => todo.id === id)

    if (rowIndex >= 0) {
      todos.value[rowIndex] = nextTodo
    }

    if (overviewIndex >= 0) {
      overviewTodos.value[overviewIndex] = nextTodo
    }

    if (successMessage) {
      statusMessage.value = successMessage
    }

    if (selectedFilter.value !== 'all') {
      await loadTodos()
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '更新待办失败'
      await refreshData()
      return
    }

    errorMessage.value = '更新待办失败'
    await refreshData()
  } finally {
    savingId.value = null
  }
}

async function toggleTodo(todo: Todo) {
  await patchTodo(todo.id, { completed: !todo.completed }, todo.completed ? '任务已恢复。' : '任务已完成。')
}

async function saveTitle(todo: Todo) {
  await patchTodo(todo.id, { title: todo.title }, '标题已更新。')
}

async function savePriority(todo: Todo) {
  await patchTodo(todo.id, { priority: todo.priority }, '优先级已更新。')
}

async function handleDeleteTodo(todo: Todo) {
  if (!window.confirm(`确认删除“${todo.title}”吗？此操作不可恢复。`)) {
    return
  }

  deletingId.value = todo.id
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await deleteTodo(todo.id)
    statusMessage.value = '任务已删除。'
    await refreshData()
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '删除待办失败'
      return
    }

    errorMessage.value = '删除待办失败'
  } finally {
    deletingId.value = null
  }
}

async function focusComposer() {
  await nextTick()
  composerRef.value?.focus()
}

async function handleLogout() {
  authStore.clearSession()
  await router.push('/login')
}

watch(selectedFilter, () => {
  loadTodos().catch(() => {
    errorMessage.value = '加载待办失败'
  })
})

watch(searchKeyword, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    loadTodos().catch(() => {
      errorMessage.value = '加载待办失败'
    })
  }, 220)
})

onMounted(() => {
  refreshData()
})
</script>

<template>
  <DashboardShell
    v-model:search-value="searchKeyword"
    :endpoint-value="`${apiBaseUrl}/mcp`"
    endpoint-label="MCP Endpoint"
    :nav-items="navItems"
    search-placeholder="Search tasks..."
    :subtitle="'Organize work and keep your MCP data in sync.'"
    title="My Tasks"
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

    <section class="metrics-grid">
      <article class="metric-card">
        <span class="metric-icon blue">☑</span>
        <div>
          <strong>{{ totalCount }}</strong>
          <p>All Tasks</p>
        </div>
      </article>
      <article class="metric-card">
        <span class="metric-icon green">✓</span>
        <div>
          <strong>{{ completedCount }}</strong>
          <p>Completed</p>
        </div>
      </article>
      <article class="metric-card">
        <span class="metric-icon amber">◔</span>
        <div>
          <strong>{{ activeCount }}</strong>
          <p>In Progress</p>
        </div>
      </article>
      <article class="metric-card">
        <span class="metric-icon red">⚑</span>
        <div>
          <strong>{{ highPriorityCount }}</strong>
          <p>High Priority</p>
        </div>
      </article>
    </section>

    <section class="toolbar-card">
      <div class="filter-row">
        <div class="filter-pills">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            class="pill"
            :class="{ active: selectedFilter === filter.value }"
            @click="selectedFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <button class="new-task-button" type="button" @click="focusComposer">＋ New Task</button>
      </div>

      <div class="composer-grid">
        <input
          ref="composerRef"
          v-model="form.title"
          type="text"
          maxlength="200"
          placeholder="新增任务标题，例如：整理 MCP 演示文档"
          @keyup.enter="handleCreateTodo"
        />
        <select v-model="form.priority">
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <button class="primary-button" type="button" :disabled="creating" @click="handleCreateTodo">
          {{ creating ? '创建中...' : 'Create Task' }}
        </button>
        <textarea
          v-model="form.description"
          rows="2"
          maxlength="2000"
          placeholder="补充说明，描述任务目标或交付物。"
        />
      </div>
    </section>

    <p v-if="statusMessage" class="message success">{{ statusMessage }}</p>
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

    <section class="table-card">
      <div v-if="loading" class="state-panel">正在加载待办...</div>
      <div v-else-if="todos.length === 0" class="state-panel">当前条件下还没有任务，可以先创建一条。</div>
      <template v-else>
        <div class="table-header">
          <span>Task</span>
          <span>Priority</span>
          <span>Created</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <ul class="task-list">
          <li v-for="todo in todos" :key="todo.id" class="task-row" :class="{ complete: todo.completed }">
            <div class="task-main">
              <label class="check-wrap">
                <input
                  :checked="todo.completed"
                  type="checkbox"
                  :disabled="savingId === todo.id || deletingId === todo.id"
                  @change="toggleTodo(todo)"
                />
              </label>
              <div>
                <input
                  v-model="todo.title"
                  class="title-input"
                  type="text"
                  maxlength="200"
                  :disabled="savingId === todo.id || deletingId === todo.id"
                  @blur="saveTitle(todo)"
                  @keyup.enter="saveTitle(todo)"
                />
                <p>{{ todo.description || '这条任务还没有补充说明。' }}</p>
              </div>
            </div>

            <div class="priority-cell">
              <select
                v-model="todo.priority"
                :disabled="savingId === todo.id || deletingId === todo.id"
                @change="savePriority(todo)"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <span class="priority-dot" :data-priority="todo.priority"></span>
              <small>{{ priorityLabel(todo.priority) }}</small>
            </div>

            <div class="date-cell">
              <strong>{{ formatDate(todo.createdAt) }}</strong>
              <small>{{ formatDate(todo.dueDate) === '未设置' ? 'No due date' : `Due ${formatDate(todo.dueDate)}` }}</small>
            </div>

            <div class="status-cell">
              <span class="status-chip" :class="{ completed: todo.completed }">{{ statusLabel(todo) }}</span>
            </div>

            <div class="actions-cell">
              <button type="button" class="icon-button" @click="toggleTodo(todo)">
                {{ todo.completed ? 'Restore' : 'Complete' }}
              </button>
              <button
                type="button"
                class="icon-button danger"
                :disabled="deletingId === todo.id"
                @click="handleDeleteTodo(todo)"
              >
                {{ deletingId === todo.id ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </li>
        </ul>
      </template>
    </section>

    <section class="sync-card">
      <div>
        <strong>Changes sync with your MCP tools</strong>
        <p>Create, update, complete, and delete tasks here or from Codex. Everything stays in sync.</p>
      </div>
      <router-link to="/mcp-settings">View MCP Settings</router-link>
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
  font-size: 1rem;
}

.sidebar-card button {
  margin-top: 8px;
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  color: #314163;
  background: rgba(46, 87, 255, 0.08);
  cursor: pointer;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card,
.toolbar-card,
.table-card,
.sync-card {
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 34px rgba(31, 46, 87, 0.05);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px;
}

.metric-icon {
  display: inline-grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  font-size: 1.35rem;
}

.metric-icon.blue {
  color: #2f56ff;
  background: rgba(67, 100, 255, 0.1);
}

.metric-icon.green {
  color: #1b9c4a;
  background: rgba(27, 156, 74, 0.12);
}

.metric-icon.amber {
  color: #ff9400;
  background: rgba(255, 148, 0, 0.12);
}

.metric-icon.red {
  color: #ff476f;
  background: rgba(255, 71, 111, 0.1);
}

.metric-card strong {
  display: block;
  color: #17203a;
  font-size: 2rem;
}

.metric-card p {
  margin: 6px 0 0;
  color: #67748f;
}

.toolbar-card {
  padding: 18px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pill,
.new-task-button,
.primary-button,
.icon-button {
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  font: inherit;
}

.pill {
  padding: 11px 16px;
  color: #56627d;
  background: #f6f8fc;
}

.pill.active {
  color: #ffffff;
  background: linear-gradient(135deg, #2f56ff 0%, #5b70ff 100%);
}

.new-task-button {
  padding: 12px 16px;
  color: #ffffff;
  background: linear-gradient(135deg, #2f56ff 0%, #5b70ff 100%);
}

.composer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) 190px 160px;
  gap: 12px;
  margin-top: 16px;
}

.composer-grid textarea {
  grid-column: 1 / -1;
}

.composer-grid input,
.composer-grid select,
.composer-grid textarea,
.priority-cell select,
.title-input {
  width: 100%;
  border: 1px solid rgba(36, 52, 89, 0.12);
  border-radius: 14px;
  padding: 13px 14px;
  color: #23304d;
  background: #ffffff;
}

.composer-grid input:focus,
.composer-grid select:focus,
.composer-grid textarea:focus,
.priority-cell select:focus,
.title-input:focus {
  outline: none;
  border-color: rgba(47, 86, 255, 0.35);
  box-shadow: 0 0 0 4px rgba(47, 86, 255, 0.08);
}

.composer-grid textarea {
  resize: vertical;
}

.primary-button {
  color: #ffffff;
  background: linear-gradient(135deg, #2f56ff 0%, #5b70ff 100%);
}

.message {
  margin: 0;
  padding: 13px 14px;
  border-radius: 16px;
  font-size: 0.95rem;
}

.success {
  color: #17663b;
  background: #eef9f1;
}

.error {
  color: #a22f40;
  background: #fff2f4;
}

.table-card {
  overflow: hidden;
}

.table-header,
.task-row {
  display: grid;
  grid-template-columns: minmax(0, 2.6fr) 180px 180px 150px 180px;
  gap: 14px;
  align-items: center;
}

.table-header {
  padding: 18px 22px;
  color: #69758f;
  font-size: 0.92rem;
  border-bottom: 1px solid rgba(36, 52, 89, 0.08);
}

.task-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.task-row {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(36, 52, 89, 0.08);
}

.task-row:last-child {
  border-bottom: 0;
}

.task-row.complete {
  opacity: 0.78;
}

.task-main {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.check-wrap {
  padding-top: 6px;
}

.check-wrap input {
  width: 18px;
  height: 18px;
  accent-color: #2f56ff;
}

.title-input {
  border: 0;
  padding: 0;
  color: #17203a;
  font-size: 1.06rem;
  font-weight: 600;
  background: transparent;
}

.task-main p {
  margin: 6px 0 0;
  color: #6f7c97;
  line-height: 1.5;
}

.priority-cell {
  position: relative;
  display: grid;
  gap: 6px;
}

.priority-cell select {
  padding-left: 32px;
}

.priority-dot {
  position: absolute;
  top: 17px;
  left: 14px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.priority-dot[data-priority='low'] {
  background: #2fbf71;
}

.priority-dot[data-priority='medium'] {
  background: #ff9e2c;
}

.priority-dot[data-priority='high'] {
  background: #ff476f;
}

.priority-cell small,
.date-cell small {
  color: #8a96ad;
}

.date-cell strong {
  display: block;
  color: #32405f;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 14px;
  border-radius: 999px;
  color: #41506f;
  background: #eef2f9;
  font-size: 0.9rem;
}

.status-chip.completed {
  color: #17884e;
  background: #eaf8ef;
}

.actions-cell {
  display: flex;
  gap: 10px;
}

.icon-button {
  padding: 10px 12px;
  color: #40506e;
  background: #f4f6fb;
}

.icon-button.danger {
  color: #dc315f;
  background: #fff2f5;
}

.state-panel {
  padding: 32px 22px;
  color: #6b7894;
}

.sync-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
}

.sync-card strong {
  color: #17203a;
  font-size: 1.05rem;
}

.sync-card p {
  margin: 8px 0 0;
  color: #69758f;
}

.sync-card a {
  color: #2f56ff;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 1240px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-header {
    display: none;
  }

  .task-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .metrics-grid,
  .composer-grid,
  .sync-card {
    grid-template-columns: 1fr;
  }

  .filter-row,
  .actions-cell,
  .sync-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
