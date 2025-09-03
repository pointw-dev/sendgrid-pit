<template>
  <div class="code-editor" @keydown.tab.prevent="insertTab">
    <pre ref="pre" class="highlight" aria-hidden="true"><code :class="codeClass" v-html="highlighted"></code></pre>
    <textarea
      ref="ta"
      :value="modelValue"
      @input="onInput"
      @scroll="syncScroll"
      spellcheck="false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-handlebars';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

const props = defineProps<{ modelValue: string; language?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const ta = ref<HTMLTextAreaElement | null>(null);
const pre = ref<HTMLElement | null>(null);
const lang = computed(() => props.language || 'markup');
const codeClass = computed(() => `language-${lang.value}`);

const highlighted = computed(() => {
  const code = props.modelValue ?? '';
  try {
    return Prism.highlight(
      code,
      Prism.languages[lang.value] || Prism.languages.markup,
      lang.value
    );
  } catch {
    return escapeHtml(code);
  }
});

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  emit('update:modelValue', val);
}

function syncScroll() {
  if (!ta.value || !pre.value) return;
  pre.value.scrollTop = ta.value.scrollTop;
  pre.value.scrollLeft = ta.value.scrollLeft;
}

function insertTab() {
  if (!ta.value) return;
  const el = ta.value;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = el.value.substring(0, start);
  const after = el.value.substring(end);
  const updated = `${before}  ${after}`; // 2 spaces
  emit('update:modelValue', updated);
  nextTick(() => {
    if (!ta.value) return;
    ta.value.selectionStart = ta.value.selectionEnd = start + 2;
    syncScroll();
  });
}

watch(() => props.modelValue, () => nextTick(syncScroll));

onMounted(async () => {
  await nextTick();
  syncScroll();
});

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

</script>

<style scoped>
.code-editor {
  position: relative;
  height: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  line-height: 1.4;
  font-size: 12px;
  background: #0e0e0e;
  border: 1px solid var(--color-accent);
  border-radius: 4px;
  box-sizing: border-box;
}
.code-editor .highlight,
.code-editor textarea {
  position: absolute;
  inset: 0;
  padding: 8px; /* must match */
  box-sizing: border-box;
  overflow: auto;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: anywhere;
  tab-size: 2;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
.code-editor .highlight {
  background: transparent; /* container owns background */
  color: #ddd;
  pointer-events: none;
  margin: 0;
}
.code-editor .highlight :deep(code) {
  display: inline-block;
  min-width: 100%;
  white-space: pre-wrap !important; /* override Prism */
  padding: 0; margin: 0;
  background: transparent !important;
  font-family: inherit; font-size: inherit; line-height: inherit;
}
.code-editor textarea {
  background: transparent;
  color: transparent; /* allow prism layer to show */
  caret-color: #fff;
  border: 0;
  resize: none;
  outline: none;
}
</style>
