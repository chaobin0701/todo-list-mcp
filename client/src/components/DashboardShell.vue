<script setup lang="ts">
import AppLogo from './AppLogo.vue'

type NavItem = {
  label: string
  to: string
  icon: string
}

const props = defineProps<{
  title: string
  subtitle: string
  navItems: NavItem[]
  endpointLabel: string
  endpointValue: string
  searchValue?: string
  searchPlaceholder?: string
  userName?: string
}>()

const emit = defineEmits<{
  'update:searchValue': [value: string]
}>()

function updateSearchValue(event: Event) {
  emit('update:searchValue', (event.target as HTMLInputElement).value)
}

function initials(name?: string) {
  if (!name) {
    return 'TM'
  }

  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'TM'
}
</script>

<template>
  <section class="dashboard-shell">
    <aside class="sidebar">
      <div class="brand-row">
        <AppLogo />
        <div>
          <p class="brand-title">todo-mcp-demo</p>
          <p class="brand-subtitle">任务与 MCP 工作区</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in props.navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <slot name="sidebar-extra" />

      <div class="endpoint-card">
        <div class="endpoint-heading">
          <span>{{ props.endpointLabel }}</span>
          <strong>Connected</strong>
        </div>
        <code>{{ props.endpointValue }}</code>
      </div>
    </aside>

    <main class="workspace">
      <header class="workspace-topbar">
        <div>
          <h1>{{ props.title }}</h1>
          <p>{{ props.subtitle }}</p>
        </div>

        <div class="topbar-actions">
          <label class="search-box">
            <span class="search-icon">⌕</span>
            <input
              :value="props.searchValue ?? ''"
              :placeholder="props.searchPlaceholder ?? '搜索...'"
              type="text"
              @input="updateSearchValue"
            />
          </label>

          <div class="user-chip">
            <span class="avatar">{{ initials(props.userName) }}</span>
            <strong>{{ props.userName || '我的账号' }}</strong>
          </div>
        </div>
      </header>

      <div class="workspace-content">
        <slot />
      </div>
    </main>
  </section>
</template>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 284px minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(93, 118, 255, 0.14), transparent 28%),
    linear-gradient(180deg, #f7f9ff 0%, #fdfdff 100%);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px 18px;
  border-right: 1px solid rgba(36, 52, 89, 0.08);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 2px 10px;
}

.brand-title {
  margin: 0;
  color: #17203a;
  font-size: 1.55rem;
  font-weight: 700;
}

.brand-subtitle {
  margin: 4px 0 0;
  color: #8a96ad;
  font-size: 0.92rem;
}

.sidebar-nav {
  display: grid;
  gap: 10px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  color: #44516d;
  text-decoration: none;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #2f56ff;
  background: linear-gradient(135deg, rgba(76, 106, 255, 0.14), rgba(76, 106, 255, 0.07));
  transform: translateX(2px);
}

.nav-icon {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: rgba(76, 106, 255, 0.08);
  font-size: 0.95rem;
}

.endpoint-card {
  margin-top: auto;
  padding: 16px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 12px 30px rgba(31, 46, 87, 0.06);
}

.endpoint-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.endpoint-heading span {
  color: #5b6885;
  font-size: 0.92rem;
}

.endpoint-heading strong {
  color: #24a148;
  font-size: 0.88rem;
}

.endpoint-card code {
  display: block;
  overflow: hidden;
  color: #465270;
  font-size: 0.84rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace {
  min-width: 0;
  padding: 24px 28px 32px;
}

.workspace-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0 26px;
}

.workspace-topbar h1 {
  margin: 0;
  color: #17203a;
  font-size: clamp(2rem, 2.4vw, 2.4rem);
  line-height: 1.05;
}

.workspace-topbar p {
  margin: 10px 0 0;
  color: #6b7894;
  font-size: 1rem;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 360px;
  padding: 0 16px;
  border: 1px solid rgba(36, 52, 89, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 28px rgba(32, 47, 90, 0.05);
}

.search-icon {
  color: #8a96ad;
  font-size: 1.1rem;
}

.search-box input {
  width: 100%;
  border: 0;
  padding: 14px 0;
  background: transparent;
  color: #2a3551;
}

.search-box input:focus {
  outline: none;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 8px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
}

.avatar {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2f56ff 0%, #6c7dff 100%);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 700;
}

.user-chip strong {
  color: #23304d;
  font-size: 0.95rem;
}

.workspace-content {
  display: grid;
  gap: 18px;
}

@media (max-width: 1180px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    gap: 18px;
    border-right: 0;
    border-bottom: 1px solid rgba(36, 52, 89, 0.08);
  }

  .endpoint-card {
    margin-top: 0;
  }
}

@media (max-width: 860px) {
  .workspace {
    padding: 18px;
  }

  .workspace-topbar,
  .topbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: 0;
  }
}
</style>
