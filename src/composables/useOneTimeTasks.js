import { ref } from 'vue'

const STORAGE_KEY = 'df_one_time_tasks'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function save(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const tasks = ref(load())

export function useOneTimeTasks() {
  function addTask(title, description = '', dueDate = null, days = null, time = null, categoryId = null) {
    tasks.value.unshift({
      id: uuid(), title, description,
      dueDate: dueDate || null,
      days, time, categoryId,
      completed: false,
      createdAt: new Date().toISOString().slice(0, 10)
    })
    save(tasks.value)
  }

  function removeTask(id) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    save(tasks.value)
  }

  function toggleCompletion(id) {
    const t = tasks.value.find(t => t.id === id)
    if (t) { t.completed = !t.completed; t.completedAt = t.completed ? new Date().toISOString().slice(0, 10) : null; save(tasks.value) }
  }

  function updateTask(id, fields) {
    const t = tasks.value.find(t => t.id === id)
    if (t) { Object.assign(t, fields); save(tasks.value) }
  }

  // Reorder a subset of tasks (e.g. only repeating or only open) within the full array,
  // keeping non-subset tasks at their original positions.
  function setSubsetOrder(newOrderIds) {
    const subsetSet = new Set(newOrderIds)
    const positions = []
    tasks.value.forEach((t, i) => { if (subsetSet.has(t.id)) positions.push(i) })
    const idToTask = new Map(tasks.value.map(t => [t.id, t]))
    const newArr = [...tasks.value]
    newOrderIds.forEach((id, i) => { newArr[positions[i]] = idToTask.get(id) })
    tasks.value = newArr
    save(tasks.value)
  }

  const open = () => tasks.value.filter(t => !t.completed)
  const done = () => tasks.value.filter(t => t.completed)

  return { tasks, addTask, removeTask, toggleCompletion, updateTask, setSubsetOrder, open, done }
}
