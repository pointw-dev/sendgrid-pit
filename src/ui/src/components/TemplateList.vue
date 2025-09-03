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
      <input ref="fileInput" type="file" accept="application/json,.json" style="display:none" @change="onFileChange" />
      <v-btn size="x-small" variant="text" prepend-icon="mdi-download" @click="exportTemplates">
        Export
      </v-btn>
      <v-btn size="x-small" variant="text" prepend-icon="mdi-upload" @click="triggerImport">
        Import
      </v-btn>
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
        <v-text-field
          v-model="form.subject"
          label="Subject (Handlebars allowed)"
          density="comfortable"
          hide-details
          variant="outlined"
          class="mt-2"
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
import { useTemplatesStore, type TemplateItem as TItem } from '../stores/templates';
import TemplateItem from './TemplateItem.vue';

defineProps<{ templates: TItem[] }>();
const emit = defineEmits<{
  (e: 'select', tpl: TItem): void;
  (e: 'delete', tpl: TItem): void;
  (e: 'add', payload: { title: string; templateId: string; subject?: string }): void;
}>();

const dialog = ref(false);
const form = reactive({ title: '', templateId: '', subject: '' });
const isValid = computed(() => form.title.trim().length > 0 && form.templateId.trim().length > 0);
const fileInput = ref<HTMLInputElement | null>(null);
const store = useTemplatesStore();

function openAddDialog() {
  form.title = '';
  form.templateId = '';
  form.subject = '';
  dialog.value = true;
}

function confirmAdd() {
  if (!isValid.value) return;
  const payload = { title: form.title.trim(), templateId: form.templateId.trim(), subject: form.subject.trim() };
  dialog.value = false;
  // let parent handle persistence
  emit('add', payload);
}

function exportTemplates() {
  const data = store.templates;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sendgrid-pit-templates.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Invalid file format: expected an array');
    // crude validation of required fields
    const items = parsed.filter((t: any) => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.templateId === 'string');
    await store.importMany(items as TItem[]);
  } catch (err: any) {
    console.error(err);
    window.alert(`Import failed: ${err?.message ?? err}`);
  } finally {
    // reset input so selecting same file again triggers change
    if (input) input.value = '';
  }
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
