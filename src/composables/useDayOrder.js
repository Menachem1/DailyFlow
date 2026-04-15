import { ref } from 'vue'

const STORAGE_KEY = 'df_day_order'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}
function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const dayOrders = ref(load())

export function useDayOrder() {
  function getDayOrder(dateKey, type) {
    return dayOrders.value[dateKey]?.[type] || null
  }

  function setDayOrder(dateKey, type, ids) {
    if (!dayOrders.value[dateKey]) dayOrders.value[dateKey] = {}
    dayOrders.value[dateKey][type] = ids
    persist(dayOrders.value)
  }

  // Apply stored day order on top of a default-sorted list.
  // Stored IDs come first (in user's order), any new tasks not yet in order append at end.
  function applyOrder(dateKey, type, defaultList) {
    const order = getDayOrder(dateKey, type)
    if (!order || order.length === 0) return defaultList
    const ordered = order.map(id => defaultList.find(t => t.id === id)).filter(Boolean)
    const extras  = defaultList.filter(t => !order.includes(t.id))
    return [...ordered, ...extras]
  }

  return { getDayOrder, setDayOrder, applyOrder }
}
