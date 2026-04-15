<template>
  <div class="view">
    <header class="view-header">
      <h1>יומן</h1>
    </header>

    <!-- Today's entry -->
    <section class="section">
      <h2 class="section-title">היום – {{ todayFormatted }}</h2>
      <textarea
        class="journal-input"
        v-model="todayText"
        placeholder="כתוב כמה מילים על היום שלך..."
        rows="5"
      ></textarea>
      <div class="journal-actions">
        <span class="char-count">{{ todayText.length }} תווים</span>
        <button class="btn-primary" @click="save" :disabled="!todayText.trim()">שמור</button>
      </div>
      <div v-if="saved" class="saved-toast">✓ נשמר</div>
    </section>

    <!-- Past entries -->
    <section class="section" v-if="pastEntries.length > 0">
      <h2 class="section-title">רשומות קודמות</h2>
      <div
        v-for="entry in pastEntries"
        :key="entry.date"
        class="journal-card"
        @click="toggleExpand(entry.date)"
      >
        <div class="journal-card-header">
          <span class="journal-date">{{ formatDate(entry.date) }}</span>
          <span class="journal-preview" v-if="expanded !== entry.date">{{ preview(entry.text) }}</span>
          <button class="btn-icon danger" @click.stop="deleteEntry(entry.date)">✕</button>
        </div>
        <div v-if="expanded === entry.date" class="journal-full-text">
          {{ entry.text }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useJournal } from '../composables/useJournal.js'

const { saveEntry, todayEntry, allEntries, deleteEntry: del, todayKey } = useJournal()

const todayText = ref('')
const saved = ref(false)
const expanded = ref(null)

onMounted(() => {
  const entry = todayEntry()
  if (entry) todayText.value = entry.text
})

const todayFormatted = computed(() =>
  new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
)

const pastEntries = computed(() =>
  allEntries().filter(e => e.date !== todayKey())
)

function save() {
  if (!todayText.value.trim()) return
  saveEntry(todayText.value.trim())
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function preview(text) {
  return text.length > 60 ? text.slice(0, 60) + '...' : text
}

function toggleExpand(date) {
  expanded.value = expanded.value === date ? null : date
}

function deleteEntry(date) {
  if (confirm('למחוק את הרשומה הזו?')) del(date)
}
</script>
