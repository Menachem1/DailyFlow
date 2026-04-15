<template>
  <div id="app" dir="rtl">
    <router-view />

    <!-- Install PWA banner (mobile only, before install) -->
    <div v-if="showInstall" class="install-banner">
      <div class="install-banner-text">
        <strong>הוסף לבית</strong>
        <span>פתח את DailyFlow כאפליקציה</span>
      </div>
      <div class="install-banner-actions">
        <button class="install-btn" @click="install">התקן</button>
        <button class="install-dismiss" @click="dismiss">✕</button>
      </div>
    </div>

    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" active-class="active" exact>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>היום</span>
      </router-link>
      <router-link to="/tasks" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>
        <span>משימות</span>
      </router-link>
      <router-link to="/journal" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        <span>יומן</span>
      </router-link>
      <router-link to="/history" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>סטטיסטיקה</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const showInstall = ref(false)

onMounted(() => {
  // Only show on mobile devices
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  if (!isMobile) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstall.value = true
  })

  // Hide banner if already installed
  window.addEventListener('appinstalled', () => {
    showInstall.value = false
    deferredPrompt.value = null
  })
})

async function install() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') showInstall.value = false
  deferredPrompt.value = null
}

function dismiss() {
  showInstall.value = false
}
</script>
