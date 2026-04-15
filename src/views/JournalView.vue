<template>
  <div class="view">
    <!-- Day navigator -->
    <header class="day-nav-header">
      <button class="nav-arrow" @click="shiftDay(-1)">&#8594;</button>
      <div class="day-nav-center" @click="goToday">
        <span class="day-nav-title">{{ dayLabel }}</span>
        <span class="day-nav-sub">{{ isToday ? formattedDate : '' }}</span>
        <span v-if="!isToday" class="go-today-hint">חזור להיום</span>
      </div>
      <button class="nav-arrow" @click="shiftDay(1)">&#8592;</button>
    </header>

    <!-- Entry area -->
    <section class="section">
      <div class="journal-day-header">
        <span class="journal-day-label">{{ isToday ? '' : formattedDate }}</span>
        <span v-if="hasEntry" class="journal-entry-dot" title="יש רשומה ליום זה">●</span>
        <button v-if="hasEntry" class="btn-icon danger" style="margin-right: auto" @click="deleteCurrentEntry" title="מחק רשומה">✕</button>
      </div>

      <textarea
        class="journal-input"
        v-model="currentText"
        :placeholder="isFuture ? 'כתוב הערות לתכנון היום...' : 'כתוב כמה מילים על היום שלך...'"
        rows="7"
      ></textarea>

      <div class="journal-actions">
        <span class="char-count">{{ currentText.length }} תווים</span>
        <button class="btn-primary" @click="saveNow" :disabled="!currentText.trim()">שמור</button>
      </div>
      <div v-if="savedToast" class="saved-toast">✓ נשמר</div>
    </section>

    <!-- Mini entry list for quick navigation -->
    <section v-if="recentEntries.length > 0" class="section">
      <h2 class="section-title">רשומות אחרונות</h2>
      <div
        v-for="entry in recentEntries"
        :key="entry.date"
        class="journal-card"
        :class="{ 'journal-card-active': entry.date === selectedKey }"
        @click="jumpToDate(entry.date)"
      >
        <div class="journal-card-header">
          <span class="journal-date">{{ formatDate(entry.date) }}</span>
          <span class="journal-preview">{{ preview(entry.text) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useJournal } from '../composables/useJournal.js'

const { saveEntry, getEntry, deleteEntry, allEntries, todayKey } = useJournal()

// ── date navigation ──────────────────────────────────────────
const offset = ref(0)

function dateOf(off) {
  const d = new Date()
  d.setDate(d.getDate() + off)
  return d
}

const selectedDate = computed(() => dateOf(offset.value))
const selectedKey  = computed(() => selectedDate.value.toISOString().slice(0, 10))
const isToday      = computed(() => offset.value === 0)
const isYesterday  = computed(() => offset.value === -1)
const isTomorrow   = computed(() => offset.value === 1)
const isFuture     = computed(() => offset.value > 0)

function shiftDay(delta) { offset.value += delta }
function goToday()       { offset.value = 0 }

function jumpToDate(dateKey) {
  const today = new Date(todayKey())
  const target = new Date(dateKey)
  const diff = Math.round((target - today) / 86400000)
  offset.value = diff
}

const formattedDate = computed(() =>
  selectedDate.value.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

const dayLabel = computed(() => {
  if (isToday.value)     return 'היום'
  if (isTomorrow.value)  return 'מחר'
  if (isYesterday.value) return 'אתמול'
  return selectedDate.value.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
})

// ── entry state ──────────────────────────────────────────────
const currentText = ref('')
const savedToast  = ref(false)

// Load entry when date changes; auto-save previous if dirty
let prevKey  = null
let prevText = ''

watch(selectedKey, (newKey, oldKey) => {
  // auto-save previous day if dirty
  if (oldKey && prevText.trim() && prevText !== (getEntry(oldKey)?.text || '')) {
    saveEntry(prevText.trim(), oldKey)
  }
  const entry = getEntry(newKey)
  currentText.value = entry?.text || ''
  prevKey  = newKey
  prevText = currentText.value
}, { immediate: true })

// track text changes for auto-save-on-navigate
watch(currentText, (val) => { prevText = val })

const hasEntry = computed(() => !!getEntry(selectedKey.value))

function saveNow() {
  if (!currentText.value.trim()) return
  saveEntry(currentText.value.trim(), selectedKey.value)
  prevText = currentText.value.trim()
  savedToast.value = true
  setTimeout(() => savedToast.value = false, 2000)
}

function deleteCurrentEntry() {
  if (confirm('למחוק את הרשומה הזו?')) {
    deleteEntry(selectedKey.value)
    currentText.value = ''
    prevText = ''
  }
}

// ── recent entries list ──────────────────────────────────────
function formatDate(date) {
  return new Date(date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function preview(text) {
  return text.length > 55 ? text.slice(0, 55) + '...' : text
}

const recentEntries = computed(() =>
  allEntries()
    .filter(e => e.date !== selectedKey.value)
    .slice(0, 5)
)
</script>
