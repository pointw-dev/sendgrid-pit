<template>
  <section class="message-list">
    <div class="message-list-toolbar">
      <v-btn
        class="bg-light-blue-darken-4"
        size="x-small"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
      >
        Add Template
      </v-btn>
      <v-spacer />
    </div>
    <div v-if="templates.length === 0" class="message-list-empty"><em>No templates yet.</em></div>
    <div v-else class="message-list-items">
      <TemplateItem
        v-for="t in templates"
        :key="t.id"
        :template="t"
        @select="$emit('select', t)"
        @delete="$emit('delete', t)"
      />
    </div>

    <v-dialog v-model="dialog" max-width="420">
      <v-card class="pa-3">
        <div class="text-h6 mb-2">Add Template</div>
        <v-text-field
          v-model="form.title"
          label="Template Title"
          density="comfortable"
          hide-details
          variant="outlined"
          class="mb-2"
        />
        <v-text-field
          v-model="form.templateId"
          label="Template ID"
          density="comfortable"
          hide-details
          variant="outlined"
        />
        <div class="d-flex justify-end mt-4" style="gap: 8px;">
          <v-btn variant="text" @click="dialog=false">Cancel</v-btn>
          <v-btn class="bg-light-blue-darken-4" :disabled="!isValid" @click="confirmAdd">OK</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import type { TemplateItem as TItem } from '../stores/templates';
import TemplateItem from './TemplateItem.vue';

defineProps<{ templates: TItem[] }>();
const emit = defineEmits<{
  (e: 'select', tpl: TItem): void;
  (e: 'delete', tpl: TItem): void;
  (e: 'add', payload: { title: string; templateId: string }): void;
}>();

const dialog = ref(false);
const form = reactive({ title: '', templateId: '' });
const isValid = computed(() => form.title.trim().length > 0 && form.templateId.trim().length > 0);

function openAddDialog() {
  form.title = '';
  form.templateId = '';
  dialog.value = true;
}

function confirmAdd() {
  if (!isValid.value) return;
  const payload = { title: form.title.trim(), templateId: form.templateId.trim() };
  dialog.value = false;
  // let parent handle persistence
  emit('add', payload);
}
</script>

<style scoped>
.message-list-toolbar {
  position: sticky;
  top: 0;
  background-color: var(--color-surface);
  z-index: 1;
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}
.message-list-items {
  list-style: none;
  font-size: 9pt;
  padding: 0;
  margin: 0;
}
</style>
