<template>
  <div class="view">
    <!-- Date navigator -->
    <header class="day-nav-header">
      <button class="nav-arrow" @click="shiftDay(-1)">&#8594;</button>
      <div class="day-nav-center" @click="goToday">
        <span class="day-nav-title">{{ isToday ? 'היום' : isTomorrow ? 'מחר' : isYesterday ? 'אתמול' : formattedDate }}</span>
        <span class="day-nav-sub">{{ isToday ? formattedDate : '' }}</span>
        <span v-if="!isToday" class="go-today-hint">חזור להיום</span>
      </div>
      <button class="nav-arrow" @click="shiftDay(1)">&#8592;</button>
    </header>

    <!-- Recurring Tasks -->
    <section class="section">
      <h2 class="section-title">משימות קבועות</h2>
      <div v-if="recurringTasks.length === 0" class="empty-state">
        אין משימות קבועות ליום זה
      </div>
      <div class="task-list">
        <div
          v-for="task in recurringTasks"
          :key="task.id"
          class="task-card"
          :class="{ completed: task.days ? task.completed : isCompletedOn(task.id, selectedKey) }"
          :style="taskCardStyle(task.categoryId)"
          @click="task.days ? toggleOneTime(task.id) : toggleCompletionOn(task.id, selectedKey)"
        >
          <div class="task-check">
            <div class="checkbox" :class="{ checked: task.days ? task.completed : isCompletedOn(task.id, selectedKey) }">
              <svg v-if="task.days ? task.completed : isCompletedOn(task.id, selectedKey)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <div class="task-body">
            <span class="task-title">{{ task.title }}</span>
            <div class="task-meta-row">
              <span v-if="task.time" class="task-time">{{ task.time }}</span>
              <span v-if="task.categoryId && getCategoryById(task.categoryId)" class="category-badge" :style="categoryStyle(task.categoryId)">{{ getCategoryById(task.categoryId).name }}</span>
            </div>
          </div>
          <span class="task-badge recurring">קבוע</span>
        </div>
      </div>
    </section>

    <!-- One-time Tasks -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">משימות להיום</h2>
        <button class="btn-add" @click="showAddOne = true">+ הוסף</button>
      </div>
      <div v-if="openOneTime.length === 0 && doneOneTime.length === 0" class="empty-state">
        אין משימות נוספות ליום זה
      </div>
      <div class="task-list">
        <!-- Open tasks -->
        <div
          v-for="task in openOneTime"
          :key="task.id"
          class="task-card"
          :style="taskCardStyle(task.categoryId)"
        >
          <div class="task-check" @click="toggleOneTime(task.id)">
            <div class="checkbox">
            </div>
          </div>
          <div class="task-body" @click="toggleOneTime(task.id)">
            <span class="task-title">{{ task.title }}</span>
            <div class="task-meta-row">
              <span v-if="task.time" class="task-time">{{ task.time }}</span>
              <span v-if="task.dueDate && task.days" class="task-due">יעד: {{ formatDate(task.dueDate) }}</span>
              <span v-if="task.categoryId && getCategoryById(task.categoryId)" class="category-badge" :style="categoryStyle(task.categoryId)">{{ getCategoryById(task.categoryId).name }}</span>
            </div>
          </div>
          <button class="btn-icon danger" @click.stop="removeOneTime(task.id)">✕</button>
        </div>

        <!-- Divider -->
        <div v-if="openOneTime.length > 0 && doneOneTime.length > 0" class="done-divider">
          <span>בוצע</span>
        </div>
        <div v-if="openOneTime.length === 0 && doneOneTime.length > 0" class="done-divider">
          <span>בוצע</span>
        </div>

        <!-- Done tasks -->
        <div
          v-for="task in doneOneTime"
          :key="task.id"
          class="task-card completed"
          :style="taskCardStyle(task.categoryId)"
        >
          <div class="task-check" @click="toggleOneTime(task.id)">
            <div class="checkbox checked">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <div class="task-body" @click="toggleOneTime(task.id)">
            <span class="task-title">{{ task.title }}</span>
          </div>
          <button class="btn-icon danger" @click.stop="removeOneTime(task.id)">✕</button>
        </div>
      </div>
    </section>

    <!-- Progress -->
    <section class="section progress-section">
      <div class="progress-card">
        <div class="progress-bar-wrap">
          <div class="progress-label">
            <span>ביצוע יומי</span>
            <span>{{ completedCount }}/{{ totalCount }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
        </div>
      </div>
    </section>

    <AddTaskModal
      v-if="showAddOne"
      type="oneTime"
      :default-due="selectedKey"
      @save="onAddOneTime"
      @close="showAddOne = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecurringTasks } from '../composables/useRecurringTasks.js'
import { useOneTimeTasks } from '../composables/useOneTimeTasks.js'
import { useCategories } from '../composables/useCategories.js'
import AddTaskModal from '../components/AddTaskModal.vue'

const { tasks: recurringSource, tasksForDate, isCompletedOn, toggleCompletionOn } = useRecurringTasks()
const { addTask, toggleCompletion: toggleOneTime, removeTask: removeOneTime, tasks: allOneTime } = useOneTimeTasks()
const { getCategoryById, categoryStyle, taskCardStyle } = useCategories()

// ── date state ──────────────────────────────────────────────
const offset = ref(0)

function dateOf(off) {
  const d = new Date()
  d.setDate(d.getDate() + off)
  return d
}

const selectedDate = computed(() => dateOf(offset.value))
const selectedKey  = computed(() => selectedDate.value.toISOString().slice(0, 10))

const isToday     = computed(() => offset.value === 0)
const isYesterday = computed(() => offset.value === -1)
const isTomorrow  = computed(() => offset.value === 1)

function shiftDay(delta) { offset.value += delta }
function goToday() { offset.value = 0 }

const formattedDate = computed(() =>
  selectedDate.value.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// ── task filtering ───────────────────────────────────────────

function sortByTime(arr) {
  return [...arr].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })
}

// "קבועות" = tasks from useRecurringTasks + one-time tasks that have days set
const recurringTasks = computed(() => {
  const key = selectedKey.value
  const dow = selectedDate.value.getDay()
  const base = tasksForDate(selectedDate.value)

  const repeating = allOneTime.value.filter(t => {
    if (!t.days) return false
    if (!t.days.includes(dow)) return false
    if (t.dueDate && key > t.dueDate) return false
    if (t.completed) return t.completedAt === key
    return true
  })

  return sortByTime([...base, ...repeating])
})

// one-time tasks WITHOUT days
const oneTimeTasks = computed(() => {
  const key = selectedKey.value
  const dow = selectedDate.value.getDay()
  return allOneTime.value.filter(t => {
    if (t.days) return false // handled in recurringTasks
    if (t.completed) return t.completedAt === key
    if (t.dueDate) return key === t.dueDate
    return true // floating task — always visible
  })
})

const openOneTime = computed(() => oneTimeTasks.value.filter(t => !t.completed))
const doneOneTime = computed(() => oneTimeTasks.value.filter(t => t.completed))

// ── progress ─────────────────────────────────────────────────
const completedCount = computed(() => {
  const recIds = new Set(recurringSource.value.map(t => t.id))
  const rec = recurringTasks.value.filter(t =>
    recIds.has(t.id) ? isCompletedOn(t.id, selectedKey.value) : t.completed
  ).length
  const one = doneOneTime.value.length
  return rec + one
})
const totalCount = computed(() => recurringTasks.value.length + oneTimeTasks.value.length)
const progressPct = computed(() =>
  totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100)
)

// ── helpers ──────────────────────────────────────────────────
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
function formatDays(days) {
  if (days.length === 7) return 'כל יום'
  return days.map(d => DAY_NAMES[d]).join(' ')
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

function onAddOneTime({ title, description, dueDate, days, time, categoryId }) {
  addTask(title, description, dueDate || null, days, time, categoryId)
  showAddOne.value = false
}

const showAddOne = ref(false)
</script>
