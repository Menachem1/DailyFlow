import { ref } from 'vue'

const STORAGE_KEY = 'df_recurring_tasks'
const COMPLETIONS_KEY = 'df_daily_completions'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function loadCompletions() {
  try { return JSON.parse(localStorage.getItem(COMPLETIONS_KEY)) || {} } catch { return {} }
}
function save(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
function saveCompletions(completions) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions))
}
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

const tasks = ref(load())
const completions = ref(loadCompletions())

export function useRecurringTasks() {
  function addTask(title, days, time = null) {
    tasks.value.push({ id: uuid(), title, days, time, createdAt: todayKey() })
    save(tasks.value)
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    save(tasks.value)
  }

  function updateTask(id, title, days, time = null) {
    const t = tasks.value.find(t => t.id === id)
    if (t) { t.title = title; t.days = days; t.time = time; save(tasks.value) }
  }

  function tasksForDate(date) {
    const dow = date.getDay()
    const dateKey = date.toISOString().slice(0, 10)
    return tasks.value.filter(t => t.days.includes(dow) && t.createdAt <= dateKey)
  }

  function isCompletedOn(taskId, dateKey) {
    return (completions.value[dateKey]?.recurring || []).includes(taskId)
  }

  function toggleCompletionOn(taskId, dateKey) {
    if (!completions.value[dateKey]) completions.value[dateKey] = { recurring: [], oneTime: [] }
    const list = completions.value[dateKey].recurring
    const idx = list.indexOf(taskId)
    if (idx === -1) list.push(taskId)
    else list.splice(idx, 1)
    saveCompletions(completions.value)
  }

  // keep old names for history/stats that still use "today"
  function isCompleted(taskId) { return isCompletedOn(taskId, todayKey()) }
  function toggleCompletion(taskId) { return toggleCompletionOn(taskId, todayKey()) }

  function getCompletionRate(taskId, days = 7) {
    let total = 0, done = 0
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return 0
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const dow = d.getDay()
      if (!task.days.includes(dow)) continue
      total++
      const key = d.toISOString().slice(0, 10)
      if ((completions.value[key]?.recurring || []).includes(taskId)) done++
    }
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  function getHistory(days = 30) {
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const dow = d.getDay()
      const dayTasks = tasks.value.filter(t => t.days.includes(dow))
      const completed = (completions.value[key]?.recurring || []).filter(id =>
        dayTasks.some(t => t.id === id)
      ).length
      result.push({ date: key, total: dayTasks.length, completed })
    }
    return result
  }

  return { tasks, addTask, removeTask, updateTask, tasksForDate, isCompletedOn, toggleCompletionOn, isCompleted, toggleCompletion, getCompletionRate, getHistory }
}
