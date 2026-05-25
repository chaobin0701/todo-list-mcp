<script setup lang="ts">
import axios from 'axios'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLogo from '../components/AppLogo.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const errorMessage = ref('')
const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect ? redirect : '/todos'
})

async function handleSubmit() {
  errorMessage.value = ''

  try {
    await authStore.loginWithPassword(form.email, form.password)
    await router.push(redirectTarget.value)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '登录失败'
      return
    }

    errorMessage.value = '登录失败'
  }
}
</script>

<template>
  <section class="auth-shell">
    <div class="auth-card">
      <aside class="marketing-panel">
        <div class="brand-row">
          <AppLogo />
          <strong>todo-mcp-demo</strong>
        </div>

        <div class="hero-copy">
          <h1>你的待办。已连接。与 MCP 同步。</h1>
          <p>管理任务、生成 MCP Token，并把同一份 Todo 数据安全地开放给 Codex 调用。</p>
        </div>

        <div class="feature-list">
          <article>
            <span>☑</span>
            <div>
              <strong>Organize with confidence</strong>
              <p>优先级、状态、任务编辑和删除都在一个工作台里完成。</p>
            </div>
          </article>
          <article>
            <span>⇄</span>
            <div>
              <strong>Connect MCP tools</strong>
              <p>网页和 MCP 调用共用同一份后端数据，演示链路更直观。</p>
            </div>
          </article>
          <article>
            <span>⛨</span>
            <div>
              <strong>Secure by design</strong>
              <p>删除类操作需要确认，Token 也可以随时撤销。</p>
            </div>
          </article>
        </div>

        <div class="security-note">
          <span>🔐</span>
          <p>你的 Todo 数据也可以通过 MCP 工具进行受控访问。</p>
        </div>
      </aside>

      <main class="form-panel">
        <form class="signin-card" @submit.prevent="handleSubmit">
          <div class="heading-block">
            <h2>欢迎回来</h2>
            <p>登录账号后即可继续管理待办并配置 MCP 工具。</p>
          </div>

          <label class="field">
            <span>Email</span>
            <input v-model="form.email" type="email" autocomplete="email" placeholder="you@company.com" required />
          </label>

          <label class="field">
            <span>Password</span>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              minlength="6"
              placeholder="输入你的密码"
              required
            />
          </label>

          <div class="minor-row">
            <label class="remember">
              <input checked type="checkbox" />
              <span>Remember me</span>
            </label>
            <span class="helper-text">当前版本仅支持邮箱密码登录</span>
          </div>

          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

          <button class="primary-button" type="submit" :disabled="authStore.loading">
            {{ authStore.loading ? '登录中...' : 'Sign In' }}
          </button>

          <p class="footer-copy">
            还没有账号？
            <router-link to="/register">Create one</router-link>
          </p>
        </form>
      </main>
    </div>
  </section>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(69, 98, 255, 0.14), transparent 28%),
    radial-gradient(circle at bottom left, rgba(69, 98, 255, 0.12), transparent 22%),
    linear-gradient(180deg, #f6f8fe 0%, #fcfdff 100%);
}

.auth-card {
  display: grid;
  grid-template-columns: 0.96fr 1.04fr;
  width: min(1380px, 100%);
  min-height: 820px;
  overflow: hidden;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 28px 70px rgba(31, 46, 87, 0.08);
}

.marketing-panel,
.form-panel {
  padding: 42px 52px;
}

.marketing-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
  background:
    radial-gradient(circle at 78% 32%, rgba(87, 117, 255, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(243, 246, 255, 0.98), rgba(236, 241, 255, 0.9));
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-row strong {
  color: #17203a;
  font-size: 1.9rem;
}

.hero-copy h1 {
  margin: 0;
  max-width: 9ch;
  color: #17203a;
  font-size: clamp(3rem, 5vw, 4.7rem);
  line-height: 0.95;
}

.hero-copy p {
  max-width: 22rem;
  margin: 18px 0 0;
  color: #596681;
  font-size: 1.15rem;
  line-height: 1.7;
}

.feature-list {
  display: grid;
  gap: 18px;
}

.feature-list article,
.security-note {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.feature-list span,
.security-note span {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  color: #2f56ff;
  font-size: 1.4rem;
  background: rgba(47, 86, 255, 0.08);
}

.feature-list strong,
.security-note p,
.heading-block h2 {
  color: #17203a;
}

.feature-list p {
  margin: 6px 0 0;
  color: #67748f;
  line-height: 1.6;
}

.security-note {
  margin-top: auto;
  padding: 18px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
}

.security-note p {
  margin: 0;
  color: #4f5e7d;
  line-height: 1.6;
}

.form-panel {
  display: grid;
  place-items: center;
}

.signin-card {
  width: min(560px, 100%);
  padding: 42px 40px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 50px rgba(31, 46, 87, 0.06);
}

.heading-block {
  margin-bottom: 26px;
  text-align: center;
}

.heading-block h2 {
  margin: 0;
  font-size: 3rem;
}

.heading-block p {
  margin: 14px 0 0;
  color: #63708b;
  font-size: 1.08rem;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.field span,
.remember span {
  color: #44516d;
  font-size: 0.96rem;
}

.field input {
  width: 100%;
  border: 1px solid rgba(36, 52, 89, 0.12);
  border-radius: 16px;
  padding: 15px 16px;
  color: #24314d;
  background: #ffffff;
}

.field input:focus {
  outline: none;
  border-color: rgba(47, 86, 255, 0.34);
  box-shadow: 0 0 0 4px rgba(47, 86, 255, 0.08);
}

.minor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.remember input {
  width: 16px;
  height: 16px;
  accent-color: #2f56ff;
}

.helper-text {
  color: #6f7c97;
  font-size: 0.92rem;
}

.primary-button {
  width: 100%;
  margin-top: 20px;
  border: 0;
  border-radius: 16px;
  padding: 16px 18px;
  color: #ffffff;
  font: inherit;
  font-size: 1.05rem;
  background: linear-gradient(135deg, #2f56ff 0%, #5b70ff 100%);
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.72;
  cursor: wait;
}

.message {
  margin: 18px 0 0;
  padding: 13px 14px;
  border-radius: 16px;
}

.error {
  color: #a22f40;
  background: #fff2f4;
}

.footer-copy {
  margin: 22px 0 0;
  color: #67748f;
  text-align: center;
}

.footer-copy a {
  color: #2f56ff;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 1100px) {
  .auth-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .auth-shell {
    padding: 16px;
  }

  .marketing-panel,
  .form-panel,
  .signin-card {
    padding: 24px;
  }

  .minor-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
