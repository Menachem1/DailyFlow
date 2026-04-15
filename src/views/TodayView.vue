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
      <div v-if="recurringList.length === 0" class="empty-state">
        אין משימות קבועות ליום זה
      </div>
      <draggable
        v-model="recurringList"
        class="task-list"
        item-key="id"
        handle=".drag-handle"
        ghost-class="drag-ghost"
        :animation="150"
        @end="onRecurringReorder"
      >
        <template #item="{ element: task }">
          <div
            class="task-card"
            :class="{ completed: task.days ? task.completed : isCompletedOn(task.id, selectedKey) }"
            :style="taskCardStyle(task.categoryId)"
            @click="task.days ? toggleOneTime(task.id) : toggleCompletionOn(task.id, selectedKey)"
          >
            <span class="drag-handle" @click.stop><DragIcon /></span>
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
        </template>
      </draggable>
    </section>

    <!-- One-time Tasks -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">משימות להיום</h2>
        <button class="btn-add" @click="showAddOne = true">+ הוסף</button>
      </div>
      <div v-if="openOneTimeList.length === 0 && doneOneTime.length === 0" class="empty-state">
        אין משימות נוספות ליום זה
      </div>
      <div class="task-list">
        <!-- Open tasks (draggable) -->
        <draggable
          v-model="openOneTimeList"
          item-key="id"
          handle=".drag-handle"
          ghost-class="drag-ghost"
          :animation="150"
          @end="onOneTimeReorder"
        >
          <template #item="{ element: task }">
            <div class="task-card" :style="taskCardStyle(task.categoryId)">
              <span class="drag-handle" @click.stop><DragIcon /></span>
              <div class="task-check" @click="toggleOneTime(task.id)">
                <div class="checkbox"></div>
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
          </template>
        </draggable>

        <!-- Divider -->
        <div v-if="openOneTimeList.length > 0 && doneOneTime.length > 0" class="done-divider"><span>בוצע</span></div>
        <div v-if="openOneTimeList.length === 0 && doneOneTime.length > 0" class="done-divider"><span>בוצע</span></div>

        <!-- Done tasks (no drag) -->
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
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { useRecurringTasks } from '../composables/useRecurringTasks.js'
import { useOneTimeTasks } from '../composables/useOneTimeTasks.js'
import { useCategories } from '../composables/useCategories.js'
import { useDayOrder } from '../composables/useDayOrder.js'
import AddTaskModal from '../components/AddTaskModal.vue'

// ── drag handle icon ─────────────────────────────────────────
const DragIcon = {
  template: `<svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" style="display:block">
    <circle cx="4" cy="3.5" r="1.5"/><circle cx="8" cy="3.5" r="1.5"/>
    <circle cx="4" cy="9"   r="1.5"/><circle cx="8" cy="9"   r="1.5"/>
    <circle cx="4" cy="14.5" r="1.5"/><circle cx="8" cy="14.5" r="1.5"/>
  </svg>`
}

const { tasks: recurringSource, tasksForDate, isCompletedOn, toggleCompletionOn } = useRecurringTasks()
const { addTask, toggleCompletion: toggleOneTime, removeTask: removeOneTime, tasks: allOneTime } = useOneTimeTasks()
const { getCategoryById, categoryStyle, taskCardStyle } = useCategories()
const { setDayOrder, applyOrder } = useDayOrder()

// ── date state ───────────────────────────────────────────────
const offset = ref(0)

function dateOf(off) {
  const d = new Date()
  d.setDate(d.getDate() + off)
  return d
}

const selectedDate  = computed(() => dateOf(offset.value))
const selectedKey   = computed(() => selectedDate.value.toISOString().slice(0, 10))
const isToday       = computed(() => offset.value === 0)
const isYesterday   = computed(() => offset.value === -1)
const isTomorrow    = computed(() => offset.value === 1)

function shiftDay(delta) { offset.value += delta }
function goToday()       { offset.value = 0 }

const formattedDate = computed(() =>
  selectedDate.value.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

// ── base task computeds (unordered) ─────────────────────────

function sortByTime(arr) {
  return [...arr].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })
}

const recurringTasksBase = computed(() => {
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

const oneTimeTasks = computed(() => {
  const key = selectedKey.value
  return allOneTime.value.filter(t => {
    if (t.days) return false
    if (t.completed) return t.completedAt === key
    if (t.dueDate) return key === t.dueDate
    return true
  })
})

const openOneTimeBase = computed(() => oneTimeTasks.value.filter(t => !t.completed))
const doneOneTime     = computed(() => oneTimeTasks.value.filter(t => t.completed))

// ── day-ordered lists (refs, updated by watch) ───────────────
// Watch only depends on base computeds + selectedKey — NOT on dayOrders.
// After onRecurringReorder / onOneTimeReorder calls setDayOrder,
// dayOrders reactive ref changes, but since it's not in the watch dependencies
// the watch does NOT re-fire. No circular update.

const recurringList    = ref([])
const openOneTimeList  = ref([])

watch(
  [selectedKey, recurringTasksBase],
  () => { recurringList.value = applyOrder(selectedKey.value, 'recurring', recurringTasksBase.value) },
  { immediate: true }
)

watch(
  [selectedKey, openOneTimeBase],
  () => { openOneTimeList.value = applyOrder(selectedKey.value, 'oneTime', openOneTimeBase.value) },
  { immediate: true }
)

function onRecurringReorder() {
  setDayOrder(selectedKey.value, 'recurring', recurringList.value.map(t => t.id))
}

function onOneTimeReorder() {
  setDayOrder(selectedKey.value, 'oneTime', openOneTimeList.value.map(t => t.id))
}

// ── progress ─────────────────────────────────────────────────
const completedCount = computed(() => {
  const recIds = new Set(recurringSource.value.map(t => t.id))
  const rec = recurringList.value.filter(t =>
    recIds.has(t.id) ? isCompletedOn(t.id, selectedKey.value) : t.completed
  ).length
  return rec + doneOneTime.value.length
})
const totalCount  = computed(() => recurringList.value.length + oneTimeTasks.value.length)
const progressPct = computed(() =>
  totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100)
)

// ── helpers ──────────────────────────────────────────────────
function formatDate(date) {
  return new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

function onAddOneTime({ title, description, dueDate, days, time, categoryId }) {
  addTask(title, description, dueDate || null, days, time, categoryId)
  showAddOne.value = false
}

const showAddOne = ref(false)
</script>
