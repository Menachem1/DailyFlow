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
      <div class="task-list">
        <!-- Pure recurring tasks (from useRecurringTasks) -->
        <div v-for="task in tasks" :key="task.id" class="task-card manage">
          <div class="task-body">
            <span class="task-title">{{ task.title }}</span>
            <span class="task-days">{{ formatDays(task.days) }}</span>
          </div>
          <div class="task-actions">
            <span class="rate-badge">{{ getCompletionRate(task.id) }}%</span>
            <button class="btn-icon" @click="startEdit(task)">✏️</button>
            <button class="btn-icon danger" @click="removeTask(task.id)">✕</button>
          </div>
        </div>

        <!-- One-time tasks with days (repeating) -->
        <div v-for="task in repeatingOneTime" :key="task.id" class="task-card manage">
          <div class="task-body">
            <span class="task-title">{{ task.title }}</span>
            <span class="task-days">{{ formatDays(task.days) }}</span>
            <span v-if="task.dueDate" class="task-due">יעד: {{ task.dueDate }}</span>
          </div>
          <div class="task-actions">
            <button class="btn-icon danger" @click="removeOneTime(task.id)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ONE-TIME TAB (only tasks WITHOUT days) -->
    <div v-if="tab === 'oneTime'">
      <div class="section-header" style="padding: 0 0 12px">
        <span class="section-title">{{ openTasks.length }} פתוחות</span>
        <button class="btn-add" @click="showAddOne = true">+ הוסף</button>
      </div>

      <div v-if="openTasks.length === 0" class="empty-state">אין משימות פתוחות</div>
      <div class="task-list">
        <div v-for="task in openTasks" :key="task.id" class="task-card manage">
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
            <span v-if="task.dueDate" class="task-due">יעד: {{ task.dueDate }}</span>
          </div>
          <button class="btn-icon danger" @click="removeOneTime(task.id)">✕</button>
        </div>
      </div>

      <div v-if="doneTasks.length > 0" class="section" style="margin-top: 24px">
        <div class="section-header">
          <h2 class="section-title">הושלמו ({{ doneTasks.length }})</h2>
          <button class="btn-text" @click="showDone = !showDone">{{ showDone ? 'הסתר' : 'הצג' }}</button>
        </div>
        <div v-if="showDone" class="task-list">
          <div v-for="task in doneTasks" :key="task.id" class="task-card manage completed">
            <div class="task-check" @click="toggleOneTime(task.id)">
              <div class="checkbox checked">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
            <div class="task-body">
              <span class="task-title">{{ task.title }}</span>
            </div>
            <button class="btn-icon danger" @click="removeOneTime(task.id)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Recurring Modal -->
    <AddTaskModal
      v-if="showAddRecurring"
      type="recurring"
      @save="onAddRecurring"
      @close="showAddRecurring = false"
    />

    <!-- Edit Recurring Modal -->
    <AddTaskModal
      v-if="editingTask"
      type="recurring"
      :initial="editingTask"
      @save="onEditRecurring"
      @close="editingTask = null"
    />

    <!-- Add One-time Modal -->
    <AddTaskModal
      v-if="showAddOne"
      type="oneTime"
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

const { tasks, addTask: addRecurring, removeTask, updateTask, getCompletionRate } = useRecurringTasks()
const { tasks: allOneTime, addTask: addOneTime, removeTask: removeOneTime, toggleCompletion: toggleOneTime } = useOneTimeTasks()

const tab = ref('recurring')
const showAddRecurring = ref(false)
const showAddOne = ref(false)
const editingTask = ref(null)
const showDone = ref(false)

// One-time tasks WITH days → shown in recurring tab
const repeatingOneTime = computed(() => allOneTime.value.filter(t => t.days && !t.completed))

// All recurring combined (for count)
const allRecurring = computed(() => [...tasks.value, ...repeatingOneTime.value])

// One-time tasks WITHOUT days → shown in one-time tab
const openTasks  = computed(() => allOneTime.value.filter(t => !t.days && !t.completed))
const doneTasks  = computed(() => allOneTime.value.filter(t => !t.days && t.completed))

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
function formatDays(days) {
  if (days.length === 7) return 'כל יום'
  return days.map(d => DAY_NAMES[d]).join(' ')
}

function startEdit(task) {
  editingTask.value = { ...task }
}

function onAddRecurring({ title, days }) {
  addRecurring(title, days)
  showAddRecurring.value = false
}

function onEditRecurring({ title, days }) {
  updateTask(editingTask.value.id, title, days)
  editingTask.value = null
}

function onAddOneTime({ title, description, dueDate, days }) {
  addOneTime(title, description, dueDate, days)
  showAddOne.value = false
}
</script>
