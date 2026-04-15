<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ isRecurring ? 'משימה קבועה' : 'משימה חד-פעמית' }}</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <label class="field-label">שם המשימה</label>
        <input
          class="field-input"
          v-model="title"
          placeholder="לדוגמה: תפילת שחרית"
          autofocus
          @keyup.enter="submit"
        />

        <!-- Recurring: day picker -->
        <template v-if="isRecurring">
          <label class="field-label" style="margin-top: 16px">ימים בשבוע</label>
          <div class="day-picker">
            <button
              v-for="(name, idx) in DAY_NAMES"
              :key="idx"
              class="day-btn"
              :class="{ selected: selectedDays.includes(idx) }"
              @click="toggleDay(idx)"
            >{{ name }}</button>
          </div>
          <button class="btn-text small" @click="selectAll">כל יום</button>
        </template>

        <!-- One-time: description + due date + optional recurrence -->
        <template v-else>
          <label class="field-label" style="margin-top: 16px">תיאור (אופציונלי)</label>
          <input class="field-input" v-model="description" placeholder="פרטים נוספים..." />
          <label class="field-label" style="margin-top: 16px">תאריך יעד (אופציונלי)</label>
          <input class="field-input" type="date" v-model="dueDate" />

          <div class="repeat-toggle" style="margin-top: 16px">
            <label class="toggle-label">
              <input type="checkbox" v-model="hasRepeat" />
              <span>חזרה על המשימה</span>
            </label>
          </div>
          <template v-if="hasRepeat">
            <label class="field-label" style="margin-top: 12px">ימים בשבוע</label>
            <div class="day-picker">
              <button
                v-for="(name, idx) in DAY_NAMES"
                :key="idx"
                class="day-btn"
                :class="{ selected: selectedDays.includes(idx) }"
                @click="toggleDay(idx)"
              >{{ name }}</button>
            </div>
            <button class="btn-text small" @click="selectAll">כל יום</button>
          </template>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">ביטול</button>
        <button class="btn-primary" @click="submit" :disabled="!canSubmit">שמור</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'recurring' }, // 'recurring' | 'oneTime'
  initial: { type: Object, default: null }
})
const emit = defineEmits(['save', 'close'])

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const isRecurring = computed(() => props.type === 'recurring')

const title = ref(props.initial?.title || '')
const selectedDays = ref(props.initial?.days ? [...props.initial.days] : [0, 1, 2, 3, 4, 5, 6])
const description = ref(props.initial?.description || '')
const dueDate = ref(props.initial?.dueDate || '')
const hasRepeat = ref(!!(props.initial?.days && !isRecurring.value))

const canSubmit = computed(() => {
  if (!title.value.trim()) return false
  if (isRecurring.value && selectedDays.value.length === 0) return false
  return true
})

function toggleDay(idx) {
  const i = selectedDays.value.indexOf(idx)
  if (i === -1) selectedDays.value.push(idx)
  else selectedDays.value.splice(i, 1)
  selectedDays.value.sort()
}

function selectAll() {
  selectedDays.value = [0, 1, 2, 3, 4, 5, 6]
}

function submit() {
  if (!canSubmit.value) return
  if (isRecurring.value) {
    emit('save', { title: title.value.trim(), days: selectedDays.value })
  } else {
    emit('save', {
      title: title.value.trim(),
      description: description.value.trim(),
      dueDate: dueDate.value,
      days: hasRepeat.value ? selectedDays.value : null
    })
  }
}
</script>
