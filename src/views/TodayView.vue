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
          :class="{ completed: isCompletedOn(task.id, selectedKey) }"
          @click="toggleCompletionOn(task.id, selectedKey)"
        >
          <div class="task-check">
            <div class="checkbox" :class="{ checked: isCompletedOn(task.id, selectedKey) }">
              <svg v-if="isCompletedOn(task.id, selectedKey)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <span class="task-title">{{ task.title }}</span>
          <span class="task-badge recurring">קבוע</span>
        </div>
      </div>
    </section>

    <!-- One-time Tasks -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">משימות נוספות</h2>
        <button class="btn-add" @click="showAddOne = true">+ הוסף</button>
      </div>
      <div v-if="oneTimeTasks.length === 0" class="empty-state">
        אין משימות נוספות ליום זה
      </div>
      <div class="task-list">
        <div
          v-for="task in oneTimeTasks"
          :key="task.id"
          class="task-card"
          :class="{ completed: task.completed }"
        >
          <div class="task-check" @click="toggleOneTime(task.id)">
            <div class="checkbox" :class="{ checked: task.completed }">
              <svg v-if="task.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <div class="task-body" @click="toggleOneTime(task.id)">
            <span class="task-title">{{ task.title }}</span>
            <span v-if="task.dueDate && task.days" class="task-due">יעד: {{ formatDate(task.dueDate) }}</span>
            <span v-if="task.days" class="task-days">{{ formatDays(task.days) }}</span>
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
import AddTaskModal from '../components/AddTaskModal.vue'

const { tasksForDate, isCompletedOn, toggleCompletionOn } = useRecurringTasks()
const { addTask, toggleCompletion: toggleOneTime, removeTask: removeOneTime, tasks: allOneTime } = useOneTimeTasks()

// ── date state ──────────────────────────────────────────────
const offset = ref(0) // 0=today, -1=yesterday, +1=tomorrow

function dateOf(off) {
  const d = new Date()
  d.setDate(d.getDate() + off)
  return d
}

const selectedDate = computed(() => dateOf(offset.value))
const selectedKey  = computed(() => selectedDate.value.toISOString().slice(0, 10))
const todayKey     = computed(() => new Date().toISOString().slice(0, 10))

const isToday     = computed(() => offset.value === 0)
const isYesterday = computed(() => offset.value === -1)
const isTomorrow  = computed(() => offset.value === 1)

function shiftDay(delta) {
  offset.value += delta
}
function goToday() { offset.value = 0 }

const formattedDate = computed(() =>
  selectedDate.value.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// ── task filtering ───────────────────────────────────────────
const recurringTasks = computed(() => tasksForDate(selectedDate.value))

const oneTimeTasks = computed(() => {
  const key = selectedKey.value
  const dow = selectedDate.value.getDay()
  return allOneTime.value.filter(t => {
    if (t.completed) return false
    if (t.days) {
      // recurring one-time: show on matching days, respect dueDate if set
      const dayMatch = t.days.includes(dow)
      if (!dayMatch) return false
      if (t.dueDate && key > t.dueDate) return false
      return true
    }
    // non-recurring: show only on its due date (or creation date if no due date)
    const targetDate = t.dueDate || t.createdAt
    return key === targetDate
  })
})

// ── progress ─────────────────────────────────────────────────
const completedCount = computed(() => {
  const rec = recurringTasks.value.filter(t => isCompletedOn(t.id, selectedKey.value)).length
  const one = oneTimeTasks.value.filter(t => t.completed).length
  return rec + one
})
const totalCount  = computed(() => recurringTasks.value.length + oneTimeTasks.value.length)
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

function onAddOneTime({ title, description, dueDate, days }) {
  // if no dueDate was set, default to the currently viewed date
  addTask(title, description, dueDate || selectedKey.value, days)
  showAddOne.value = false
}

const showAddOne = ref(false)
</script>
