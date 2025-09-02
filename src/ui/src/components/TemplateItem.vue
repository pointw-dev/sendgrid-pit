<template>
  <v-card class="template-list-item" @click="$emit('select', template)">
    <div class="item">
      <div class="left">
        <div class="title">{{ template.title }}</div>
        <div class="subtitle">{{ template.templateId }}</div>
      </div>
      <div class="right">
        <v-btn class="bg-red-darken-4" size="x-small" @click.stop="$emit('delete', template)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { TemplateItem } from '../stores/templates';

defineProps<{ template: TemplateItem }>();
defineEmits<{ (e: 'select', tpl: TemplateItem): void; (e: 'delete', tpl: TemplateItem): void }>();
</script>

<style scoped>
.template-list-item {
  background-color: #0d1b2a;
  color: white;
  border: 1px solid #2c3e50;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.item {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 8px;
  align-items: start;
}

.left {
  min-width: 0;
}

.title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle {
  font-size: 0.8em;
  color: #9aa5b1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: flex-start;
}
</style>

