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
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errorMessage = ref('')
const agreed = ref(true)
const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect ? redirect : '/todos'
})

async function handleSubmit() {
  errorMessage.value = ''

  if (!agreed.value) {
    errorMessage.value = '请先确认你理解 MCP Token 的使用说明'
    return
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  try {
    await authStore.registerWithPassword(form.name, form.email, form.password)
    await router.push(redirectTarget.value)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? '注册失败'
      return
    }

    errorMessage.value = '注册失败'
  }
}
</script>

<template>
  <section class="auth-shell">
    <div class="auth-card">
      <main class="form-panel">
        <div class="brand-row mobile-brand">
          <AppLogo />
          <strong>todo-mcp-demo</strong>
        </div>

        <form class="register-card" @submit.prevent="handleSubmit">
          <div class="brand-row">
            <AppLogo />
            <strong>todo-mcp-demo</strong>
          </div>

          <div class="heading-block">
            <h1>Create your account</h1>
            <p>创建工作区后就能开始管理待办，并继续配置 MCP 连接。</p>
          </div>

          <label class="field">
            <span>Full name</span>
            <input v-model="form.name" type="text" autocomplete="name" placeholder="Enter your full name" />
          </label>

          <label class="field">
            <span>Email address</span>
            <input v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com" required />
          </label>

          <label class="field">
            <span>Password</span>
            <input
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              minlength="6"
              placeholder="Create a strong password"
              required
            />
          </label>

          <label class="field">
            <span>Confirm password</span>
            <input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              minlength="6"
              placeholder="Confirm your password"
              required
            />
          </label>

          <label class="agreement">
            <input v-model="agreed" type="checkbox" />
            <span>我理解 MCP Token 需要妥善保管，不应公开分享给其他人。</span>
          </label>

          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

          <button class="primary-button" type="submit" :disabled="authStore.loading">
            {{ authStore.loading ? '注册中...' : 'Create Account' }}
          </button>

          <p class="footer-copy">
            已经有账号？
            <router-link to="/login">Sign in</router-link>
          </p>
        </form>
      </main>

      <aside class="benefits-panel">
        <div class="hero-copy">
          <h2>Everything you need to manage todos and connect with MCP</h2>
          <p>你的工作区会自带任务管理能力、MCP Token 配置和安全约束说明。</p>
        </div>

        <div class="benefit-list">
          <article>
            <span>☑</span>
            <div>
              <strong>Manage Todos</strong>
              <p>支持创建、编辑、筛选、完成和删除待办。</p>
            </div>
          </article>
          <article>
            <span>⛨</span>
            <div>
              <strong>Generate MCP Token</strong>
              <p>创建安全的 MCP Token，用于远程客户端身份认证。</p>
            </div>
          </article>
          <article>
            <span>⇄</span>
            <div>
              <strong>Connect from Codex</strong>
              <p>复制配置片段后，就能让 Codex 直接调用你的 Todo 工具。</p>
            </div>
          </article>
        </div>

        <div class="security-note">
          <span>🔐</span>
          <div>
            <strong>Your data stays secure</strong>
            <p>删除类操作需要确认，Token 只作用于当前用户的待办数据。</p>
          </div>
        </div>
      </aside>
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
    radial-gradient(circle at top left, rgba(69, 98, 255, 0.12), transparent 28%),
    linear-gradient(180deg, #f6f8fe 0%, #fcfdff 100%);
}

.auth-card {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  width: min(1380px, 100%);
  min-height: 820px;
  overflow: hidden;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 28px 70px rgba(31, 46, 87, 0.08);
}

.form-panel,
.benefits-panel {
  padding: 42px 52px;
}

.form-panel {
  background: rgba(255, 255, 255, 0.96);
}

.benefits-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  background:
    radial-gradient(circle at top left, rgba(69, 98, 255, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(245, 248, 255, 0.98), rgba(237, 242, 255, 0.9));
}

.mobile-brand {
  display: none;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-row strong {
  color: #17203a;
  font-size: 1.75rem;
}

.register-card {
  display: grid;
  gap: 0;
  max-width: 560px;
}

.heading-block {
  margin: 34px 0 10px;
}

.heading-block h1,
.hero-copy h2 {
  margin: 0;
  color: #17203a;
}

.heading-block h1 {
  font-size: clamp(2.8rem, 4.8vw, 4rem);
  line-height: 1.02;
}

.hero-copy h2 {
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1.12;
}

.heading-block p,
.hero-copy p,
.benefit-list p,
.security-note p {
  color: #67748f;
  line-height: 1.7;
}

.heading-block p {
  margin: 14px 0 0;
  font-size: 1.06rem;
}

.hero-copy p {
  margin: 16px 0 0;
  max-width: 28rem;
  font-size: 1.08rem;
}

.field {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}

.field span,
.agreement span {
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

.agreement {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
}

.agreement input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: #2f56ff;
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
}

.footer-copy a {
  color: #2f56ff;
  font-weight: 600;
  text-decoration: none;
}

.benefit-list {
  display: grid;
  gap: 18px;
}

.benefit-list article,
.security-note {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.benefit-list span,
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

.benefit-list strong,
.security-note strong {
  color: #17203a;
}

.benefit-list p {
  margin: 6px 0 0;
}

.security-note {
  padding: 18px;
  border: 1px solid rgba(36, 52, 89, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
}

.security-note p {
  margin: 6px 0 0;
}

@media (max-width: 1100px) {
  .auth-card {
    grid-template-columns: 1fr;
  }

  .mobile-brand {
    display: flex;
    margin-bottom: 10px;
  }
}

@media (max-width: 720px) {
  .auth-shell {
    padding: 16px;
  }

  .form-panel,
  .benefits-panel {
    padding: 24px;
  }
}
</style>
