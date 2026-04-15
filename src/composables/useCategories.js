import { ref } from 'vue'

const STORAGE_KEY = 'df_categories'

export const PRESET_COLORS = [
  '#6366f1', '#3B82F6', '#22C55E', '#F97316',
  '#EF4444', '#A855F7', '#EC4899', '#14B8A6',
  '#D97706', '#84CC16'
]

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function save(cats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const categories = ref(load())

export function useCategories() {
  function addCategory(name, color) {
    const cat = { id: uuid(), name: name.trim(), color }
    categories.value.push(cat)
    save(categories.value)
    return cat
  }

  function removeCategory(id) {
    categories.value = categories.value.filter(c => c.id !== id)
    save(categories.value)
  }

  function getCategoryById(id) {
    return categories.value.find(c => c.id === id) || null
  }

  function categoryStyle(categoryId) {
    const cat = getCategoryById(categoryId)
    if (!cat) return {}
    const r = parseInt(cat.color.slice(1, 3), 16)
    const g = parseInt(cat.color.slice(3, 5), 16)
    const b = parseInt(cat.color.slice(5, 7), 16)
    return {
      backgroundColor: `rgba(${r},${g},${b},0.12)`,
      color: cat.color,
      borderColor: `rgba(${r},${g},${b},0.35)`
    }
  }

  function taskCardStyle(categoryId) {
    const cat = getCategoryById(categoryId)
    if (!cat) return {}
    const r = parseInt(cat.color.slice(1, 3), 16)
    const g = parseInt(cat.color.slice(3, 5), 16)
    const b = parseInt(cat.color.slice(5, 7), 16)
    return {
      borderRightWidth: '4px',
      borderRightColor: cat.color,
      backgroundColor: `rgba(${r},${g},${b},0.05)`
    }
  }

  return { categories, PRESET_COLORS, addCategory, removeCategory, getCategoryById, categoryStyle, taskCardStyle }
}
