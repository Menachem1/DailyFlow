import { createRouter, createWebHashHistory } from 'vue-router'
import TodayView from '../views/TodayView.vue'
import TasksView from '../views/TasksView.vue'
import JournalView from '../views/JournalView.vue'
import HistoryView from '../views/HistoryView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: TodayView },
    { path: '/tasks', component: TasksView },
    { path: '/journal', component: JournalView },
    { path: '/history', component: HistoryView },
  ]
})
