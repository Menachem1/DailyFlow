<template>
  <div class="view">
    <header class="view-header">
      <h1>היסטוריה</h1>
    </header>

    <!-- Overall stats -->
    <section class="section">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ streak }}</span>
          <span class="stat-label">ימי רצף</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ weekRate }}%</span>
          <span class="stat-label">ביצוע השבוע</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalDone }}</span>
          <span class="stat-label">חד-פעמיות בוצעו</span>
        </div>
      </div>
    </section>

    <!-- Per-task rates -->
    <section class="section">
      <h2 class="section-title">ביצוע לפי משימה (30 יום)</h2>
      <div v-if="tasks.length === 0" class="empty-state">אין משימות קבועות עדיין</div>
      <div class="rate-list">
        <div v-for="task in tasks" :key="task.id" class="rate-row">
          <span class="rate-task-name">{{ task.title }}</span>
          <div class="mini-bar">
            <div class="mini-fill" :style="{ width: getCompletionRate(task.id, 30) + '%' }"></div>
          </div>
          <span class="rate-pct">{{ getCompletionRate(task.id, 30) }}%</span>
        </div>
      </div>
    </section>

    <!-- 30-day calendar heatmap -->
    <section class="section">
      <h2 class="section-title">30 הימים האחרונים</h2>
      <div class="heatmap">
        <div
          v-for="day in history"
          :key="day.date"
          class="heat-cell"
          :class="heatClass(day)"
          :title="day.date + ' – ' + day.completed + '/' + day.total"
        ></div>
      </div>
      <div class="heat-legend">
        <span class="heat-cell heat-0"></span> אפס
        <span class="heat-cell heat-1"></span> חלקי
        <span class="heat-cell heat-2"></span> טוב
        <span class="heat-cell heat-3"></span> מלא
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecurringTasks } from '../composables/useRecurringTasks.js'
import { useOneTimeTasks } from '../composables/useOneTimeTasks.js'

const { tasks, getCompletionRate, getHistory } = useRecurringTasks()
const { done } = useOneTimeTasks()

const history = computed(() => getHistory(30))
const totalDone = computed(() => done().length)

const weekRate = computed(() => {
  const week = getHistory(7)
  const total = week.reduce((s, d) => s + d.total, 0)
  const completed = week.reduce((s, d) => s + d.completed, 0)
  return total === 0 ? 0 : Math.round((completed / total) * 100)
})

const streak = computed(() => {
  const h = getHistory(60).reverse()
  let count = 0
  for (const day of h) {
    if (day.total === 0) continue
    if (day.completed === day.total) count++
    else break
  }
  return count
})

function heatClass(day) {
  if (day.total === 0) return 'heat-empty'
  const pct = day.completed / day.total
  if (pct === 0) return 'heat-0'
  if (pct < 0.5) return 'heat-1'
  if (pct < 1) return 'heat-2'
  return 'heat-3'
}
</script>
