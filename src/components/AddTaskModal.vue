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

        <!-- Recurring: day picker + time -->
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

          <label class="field-label" style="margin-top: 16px">שעה (אופציונלי)</label>
          <input class="field-input" type="time" v-model="time" />
        </template>

        <!-- One-time: description + due date + time + optional recurrence -->
        <template v-else>
          <label class="field-label" style="margin-top: 16px">תיאור (אופציונלי)</label>
          <input class="field-input" v-model="description" placeholder="פרטים נוספים..." />

          <div class="row-fields">
            <div class="row-field">
              <label class="field-label" style="margin-top: 16px">תאריך יעד (אופציונלי)</label>
              <input class="field-input" type="date" v-model="dueDate" />
            </div>
            <div class="row-field">
              <label class="field-label" style="margin-top: 16px">שעה (אופציונלי)</label>
              <input class="field-input" type="time" v-model="time" />
            </div>
          </div>

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

        <!-- Category picker (both types) -->
        <label class="field-label" style="margin-top: 16px">קטגוריה (אופציונלי)</label>
        <div class="category-chips">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="cat-chip"
            :class="{ selected: selectedCategoryId === cat.id }"
            :style="chipStyle(cat)"
            @click="toggleCategory(cat.id)"
          >{{ cat.name }}</button>
          <button class="cat-chip new-cat-btn" @click="showNewCat = !showNewCat">+ חדשה</button>
        </div>

        <!-- New category inline form -->
        <div v-if="showNewCat" class="new-cat-form">
          <input
            class="field-input"
            v-model="newCatName"
            placeholder="שם הקטגוריה"
            @keyup.enter="createCategory"
          />
          <div class="color-swatches">
            <button
              v-for="color in PRESET_COLORS"
              :key="color"
              class="color-swatch"
              :class="{ selected: newCatColor === color }"
              :style="{ backgroundColor: color }"
              @click="newCatColor = color"
            />
          </div>
          <button
            class="btn-primary"
            style="margin-top: 10px; padding: 8px 16px; font-size: 13px"
            :disabled="!newCatName.trim()"
            @click="createCategory"
          >צור קטגוריה</button>
        </div>
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
import { useCategories, PRESET_COLORS } from '../composables/useCategories.js'

const props = defineProps({
  type: { type: String, default: 'recurring' },
  initial: { type: Object, default: null }
})
const emit = defineEmits(['save', 'close'])

const { categories, addCategory, categoryStyle: getCatStyle } = useCategories()

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const isRecurring = computed(() => props.type === 'recurring')

const title          = ref(props.initial?.title || '')
const selectedDays   = ref(props.initial?.days ? [...props.initial.days] : [0, 1, 2, 3, 4, 5, 6])
const description    = ref(props.initial?.description || '')
const dueDate        = ref(props.initial?.dueDate || '')
const time           = ref(props.initial?.time || '')
const hasRepeat      = ref(!!(props.initial?.days && !isRecurring.value))
const selectedCategoryId = ref(props.initial?.categoryId || null)

const showNewCat  = ref(false)
const newCatName  = ref('')
const newCatColor = ref(PRESET_COLORS[0])

const canSubmit = computed(() => {
  if (!title.value.trim()) return false
  if (isRecurring.value && selectedDays.value.length === 0) return false
  return true
})

function chipStyle(cat) {
  const r = parseInt(cat.color.slice(1, 3), 16)
  const g = parseInt(cat.color.slice(3, 5), 16)
  const b = parseInt(cat.color.slice(5, 7), 16)
  const isSelected = selectedCategoryId.value === cat.id
  return isSelected
    ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
    : { backgroundColor: `rgba(${r},${g},${b},0.1)`, color: cat.color, borderColor: `rgba(${r},${g},${b},0.3)` }
}

function toggleCategory(id) {
  selectedCategoryId.value = selectedCategoryId.value === id ? null : id
}

function createCategory() {
  if (!newCatName.value.trim()) return
  const cat = addCategory(newCatName.value, newCatColor.value)
  selectedCategoryId.value = cat.id
  newCatName.value = ''
  newCatColor.value = PRESET_COLORS[0]
  showNewCat.value = false
}

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
    emit('save', {
      title: title.value.trim(),
      days: selectedDays.value,
      time: time.value || null,
      categoryId: selectedCategoryId.value
    })
  } else {
    emit('save', {
      title: title.value.trim(),
      description: description.value.trim(),
      dueDate: dueDate.value || null,
      time: time.value || null,
      days: hasRepeat.value ? selectedDays.value : null,
      categoryId: selectedCategoryId.value
    })
  }
}
</script>
