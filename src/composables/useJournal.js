import { ref } from 'vue'

const STORAGE_KEY = 'df_journal'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}
function save(journal) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal))
}

const journal = ref(load())

export function useJournal() {
  function todayKey() {
    return new Date().toISOString().slice(0, 10)
  }

  function saveEntry(text) {
    journal.value[todayKey()] = { text, updatedAt: new Date().toISOString() }
    save(journal.value)
  }

  function getEntry(date) {
    return journal.value[date] || null
  }

  function todayEntry() {
    return getEntry(todayKey())
  }

  function allEntries() {
    return Object.entries(journal.value)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  function deleteEntry(date) {
    delete journal.value[date]
    save(journal.value)
  }

  return { journal, saveEntry, getEntry, todayEntry, allEntries, deleteEntry, todayKey }
}
