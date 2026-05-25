<template>
  <span class="app-logo">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" />
      <path d="M8.2 12.3 11 15l5-6.2" />
      <path d="M15.7 8.3h1.9v1.9" />
    </svg>
  </span>
</template>

<style scoped>
.app-logo {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2f56ff 0%, #6c7dff 100%);
  box-shadow: 0 12px 24px rgba(47, 86, 255, 0.24);
}

svg {
  width: 22px;
  height: 22px;
}

rect {
  fill: none;
}

path {
  fill: none;
  stroke: #ffffff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}
</style>
