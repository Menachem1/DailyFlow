<template>
  <div class="view">
    <header class="view-header">
      <h1>משימות</h1>
    </header>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: tab === 'recurring' }" @click="tab = 'recurring'">קבועות</button>
      <button :class="{ active: tab === 'oneTime' }" @click="tab = 'oneTime'">חד-פעמיות</button>
    </div>

    <!-- RECURRING TAB -->
    <div v-if="tab === 'recurring'">
      <div class="section-header" style="padding: 0 0 12px">
        <span class="section-title">{{ allRecurring.length }} משימות קבועות</span>
        <button class="btn-add" @click="showAddRecurring = true">+ הוסף</button>
      </div>
      <div v-if="allRecurring.length === 0" class="empty-state">
        עדיין אין משימות קבועות.<br>לחץ "+ הוסף" כדי להתחיל.
      </div>

      <!-- Pure recurring tasks -->
      <draggable
        v-model="recurringList"
        class="task-list"
        item-key="id"
        handle=".drag-handle"
        ghost-class="drag-ghost"
        :animation="150"
      >
        <template #item="{ element: task }">
          <div class="task-card manage" :style="taskCardStyle(task.categoryId)">
            <span class="drag-handle"><DragIcon /></span>
            <div class="task-body">
              <span class="task-title">{{ task.title }}</span>
              <div class="task-meta-row">
                <span class="task-days">{{ formatDays(task.days) }}<span v-if="task.time"> · {{ task.time }}</span></span>
                <span v-if="task.categoryId && getCategoryById(task.categoryId)" class="category-badge" :style="categoryStyle(task.categoryId)">{{ getCategoryById(task.categoryId).name }}</span>
              </div>
            </div>
            <div class="task-actions">
              <span class="rate-badge">{{ getCompletionRate(task.id) }}%</span>
              <button class="btn-icon" @click="startEdit(task)">✏️</button>
              <button class="btn-icon danger" @click="removeTask(task.id)">✕</button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Repeating one-time tasks (separate drag group) -->
      <draggable
        v-model="repeatingList"
        class="task-list"
        :style="tasks.length > 0 ? 'margin-top: 6px' : ''"
        item-key="id"
        handle=".drag-handle"
        ghost-class="drag-ghost"
        :animation="150"
      >
        <template #item="{ element: task }">
          <div class="task-card manage" :style="taskCardStyle(task.categoryId)">
            <span class="drag-handle"><DragIcon /></span>
            <div class="task-body">
              <span class="task-title">{{ task.title }}</span>
              <div class="task-meta-row">
                <span class="task-days">{{ formatDays(task.days) }}<span v-if="task.time"> · {{ task.time }}</span></span>
                <span v-if="task.categoryId && getCategoryById(task.categoryId)" class="category-badge" :style="categoryStyle(task.categoryId)">{{ getCategoryById(task.categoryId).name }}</span>
              </div>
              <span v-if="task.dueDate" class="task-due">יעד: {{ task.dueDate }}</span>
            </div>
            <div class="task-actions">
              <button class="btn-icon" @click="startEditOneTime(task)">✏️</button>
              <button class="btn-icon danger" @click="removeOneTime(task.id)">✕</button>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- ONE-TIME TAB (only tasks WITHOUT days) -->
    <div v-if="tab === 'oneTime'">
      <div class="section-header" style="padding: 0 0 12px">
        <span class="section-title">{{ openTasks.length }} פתוחות</span>
        <button class="btn-add" @click="showAddOne = true">+ הוסף</button>
      </div>

      <div v-if="openTasks.length === 0" class="empty-state">אין משימות פתוחות</div>

      <!-- Open one-time tasks (draggable) -->
      <draggable
        v-model="openList"
        class="task-list"
        item-key="id"
        handle=".drag-handle"
        ghost-class="drag-ghost"
        :animation="150"
      >
        <template #item="{ element: task }">
          <div class="task-card manage" :style="taskCardStyle(task.categoryId)">
            <span class="drag-handle"><DragIcon /></span>
            <div class="task-check" @click="toggleOneTime(task.id)">
              <div class="checkbox" :class="{ checked: task.completed }">
                <svg v-if="task.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div class="task-body">
              <span class="task-title">{{ task.title }}</span>
              <span v-if="task.description" class="task-desc">{{ task.description }}</span>
              <div class="task-meta-row">
                <span v-if="task.dueDate" class="task-due">יעד: {{ task.dueDate }}</span>
                <span v-if="task.categoryId && getCategoryById(task.categoryId)" class="category-badge" :style="categoryStyle(task.categoryId)">{{ getCategoryById(task.categoryId).name }}</span>
              </div>
            </div>
            <button class="btn-icon" @click="startEditOneTime(task)">✏️</button>
            <button class="btn-icon danger" @click="removeOneTime(task.id)">✕</button>
          </div>
        </template>
      </draggable>

      <!-- Done tasks (no drag) -->
      <div v-if="doneTasks.length > 0" class="section" style="margin-top: 24px">
        <div class="section-header">
          <h2 class="section-title">הושלמו ({{ doneTasks.length }})</h2>
          <button class="btn-text" @click="showDone = !showDone">{{ showDone ? 'הסתר' : 'הצג' }}</button>
        </div>
        <div v-if="showDone" class="task-list">
          <div v-for="task in doneTasks" :key="task.id" class="task-card manage completed" :style="taskCardStyle(task.categoryId)">
            <div class="task-check" @click="toggleOneTime(task.id)">
              <div class="checkbox checked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div class="task-body">
              <span class="task-title">{{ task.title }}</span>
              <span v-if="task.categoryId && getCategoryById(task.categoryId)" class="category-badge" :style="categoryStyle(task.categoryId)">{{ getCategoryById(task.categoryId).name }}</span>
            </div>
            <button class="btn-icon" @click="startEditOneTime(task)">✏️</button>
            <button class="btn-icon danger" @click="removeOneTime(task.id)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Recurring Modal -->
    <AddTaskModal v-if="showAddRecurring" type="recurring" @save="onAddRecurring" @close="showAddRecurring = false" />

    <!-- Edit Recurring Modal -->
    <AddTaskModal v-if="editingTask" type="recurring" :initial="editingTask" @save="onEditRecurring" @close="editingTask = null" />

    <!-- Add One-time Modal -->
    <AddTaskModal v-if="showAddOne" type="oneTime" @save="onAddOneTime" @close="showAddOne = false" />

    <!-- Edit One-time Modal -->
    <AddTaskModal v-if="editingOneTimeTask" type="oneTime" :initial="editingOneTimeTask" @save="onEditOneTime" @close="editingOneTimeTask = null" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { useRecurringTasks } from '../composables/useRecurringTasks.js'
import { useOneTimeTasks } from '../composables/useOneTimeTasks.js'
import { useCategories } from '../composables/useCategories.js'
import AddTaskModal from '../components/AddTaskModal.vue'

// ── drag handle icon ─────────────────────────────────────────
const DragIcon = {
  template: `<svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" style="display:block">
    <circle cx="4" cy="3.5" r="1.5"/><circle cx="8" cy="3.5" r="1.5"/>
    <circle cx="4" cy="9"   r="1.5"/><circle cx="8" cy="9"   r="1.5"/>
    <circle cx="4" cy="14.5" r="1.5"/><circle cx="8" cy="14.5" r="1.5"/>
  </svg>`
}

const { tasks, addTask: addRecurring, removeTask, updateTask, setTasksOrder, getCompletionRate } = useRecurringTasks()
const { tasks: allOneTime, addTask: addOneTime, removeTask: removeOneTime, toggleCompletion: toggleOneTime, updateTask: updateOneTime, setSubsetOrder } = useOneTimeTasks()
const { getCategoryById, categoryStyle, taskCardStyle } = useCategories()

const tab              = ref('recurring')
const showAddRecurring = ref(false)
const showAddOne       = ref(false)
const editingTask      = ref(null)
const editingOneTimeTask = ref(null)
const showDone         = ref(false)

// ── computed base sets ───────────────────────────────────────
const repeatingOneTime = computed(() => allOneTime.value.filter(t => t.days && !t.completed))
const allRecurring     = computed(() => [...tasks.value, ...repeatingOneTime.value])
const openTasks        = computed(() => allOneTime.value.filter(t => !t.days && !t.completed))
const doneTasks        = computed(() => allOneTime.value.filter(t => !t.days && t.completed))

// ── writable computeds for drag lists ───────────────────────
// vuedraggable v-model calls the setter with the new sorted array
const recurringList = computed({
  get: () => tasks.value,
  set: (arr) => setTasksOrder(arr)
})

const repeatingList = computed({
  get: () => repeatingOneTime.value,
  set: (arr) => setSubsetOrder(arr.map(t => t.id))
})

const openList = computed({
  get: () => openTasks.value,
  set: (arr) => setSubsetOrder(arr.map(t => t.id))
})

// ── helpers ──────────────────────────────────────────────────
const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
function formatDays(days) {
  if (days.length === 7) return 'כל יום'
  return days.map(d => DAY_NAMES[d]).join(' ')
}

function startEdit(task)         { editingTask.value = { ...task } }
function startEditOneTime(task)  { editingOneTimeTask.value = { ...task } }

function onAddRecurring({ title, days, time, categoryId }) {
  addRecurring(title, days, time, categoryId)
  showAddRecurring.value = false
}
function onEditRecurring({ title, days, time, categoryId }) {
  updateTask(editingTask.value.id, title, days, time, categoryId)
  editingTask.value = null
}
function onAddOneTime({ title, description, dueDate, days, time, categoryId }) {
  addOneTime(title, description, dueDate, days, time, categoryId)
  showAddOne.value = false
}
function onEditOneTime({ title, description, dueDate, days, time, categoryId }) {
  updateOneTime(editingOneTimeTask.value.id, { title, description, dueDate, days: days || null, time: time || null, categoryId: categoryId || null })
  editingOneTimeTask.value = null
}
</script>
