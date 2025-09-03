<template>
  <div class="app-container">
    <header class="title-bar">
      <img
          src="http://www.pointw.com/img/sendgrid-pit-logo.svg"
          alt="sendgrid-pit logo"
          class="logo"
      />
      <h1 class="app-title">sendgrid-pit</h1>
    </header>
    <div class="main-layout" v-if="mainTab === 'messages'">
      <aside class="sidebar">
        <MessageList
            :messages="messages"
            @select="selectMessage"
            @delete="deleteMessage"
            class="message-list-container"
        />
      </aside>
      <main class="content">
        <div v-if="selected" class="message-detail">
          <v-list-item class="bg-transparent">
            <template v-slot:prepend>
              <v-table density="compact" class="bg-transparent">
                <tbody>
                  <tr>
                    <td>From:</td>
                    <td>{{ selected.payload.from.email }}</td>
                  </tr>
                  <tr>
                    <td>To:</td>
                    <td>{{ allToEmails(selected) }}</td>
                  </tr>
                  <tr v-if="allCcEmails(selected)">
                    <td>CC:</td>
                    <td>{{ allCcEmails(selected) }}</td>
                  </tr>
                  <tr v-if="allBccEmails(selected)">
                    <td>BCC:</td>
                    <td>{{ allBccEmails(selected) }}</td>
                  </tr>
                  <tr v-if="selected.payload.subject">
                    <td>Subject:</td>
                    <td>{{ selected.payload.subject }}</td>
                  </tr>
                  <tr v-if="selected.payload.template_id">
                    <td>Template ID:</td>
                    <td>{{ selected.payload.template_id }}</td>
                  </tr>
                  <tr>
                    <td>Date:</td>
                    <td>{{ new Date(selected.receivedAt).toLocaleString() }}</td>
                  </tr>
                  <tr v-if="selected.payload.reply_to">
                    <td>Reply To:</td>
                    <td>{{ selected.payload.reply_to.email }}</td>
                  </tr>
                  <tr>
                    <td>Message ID:</td>
                    <td>
                      {{ selected.id }}
                      <v-icon
                        class="ml-1 copy-icon"
                        size="small"
                        :color="copied ? 'green' : undefined"
                        @click="copyId(selected.id)"
                      >{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </template>
            <template v-slot:append>
              <v-btn
                  class="close-button"
                  @click="selected = null"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </v-list-item>
          <v-tabs v-model="tab" density="compact" class="mt-2 tab-bar">
            <v-tab
              v-for="t in tabs"
              :key="t.value"
              :value="t.value"
            >
              {{ t.label }}
            </v-tab>
          </v-tabs>
          <v-window v-model="tab" class="mt-2 message-view pa-3">
            <v-window-item
              v-for="t in tabs"
              :key="t.value"
              :value="t.value"
              transition="fade-transition"
              reverse-transition="fade-transition"
            >
              <div v-if="t.type === 'template'">
                <p>
                  The following data will be sent to SendGrid's template, ID:
                  {{ t.templateId }}
                </p>
                <pre class="message-detail-body">{{ pretty(t.data) }}</pre>
              </div>
              <div v-else-if="t.type === 'html'">
                <div v-html="t.data"></div>
              </div>
              <div v-else-if="t.type === 'rendered-template'" class="rendered-container">
                <RenderedPreview :html="t.data" :full-height="true" />
              </div>
              <div v-else-if="t.type === 'html-source'">
                <pre class="message-detail-body">{{ t.data }}</pre>
              </div>
              <div v-else-if="t.type === 'raw'">
                <pre class="message-detail-body">{{ pretty(t.data) }}</pre>
              </div>
              <div v-else>
                <pre class="message-detail-body">{{ t.data }}</pre>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </main>
    </div>

    <div class="main-layout" v-else>
      <aside class="sidebar">
        <TemplateList
          :templates="templates"
          @add="addTemplate"
          @select="selectTemplate"
          @delete="deleteTemplate"
        />
      </aside>
      <main class="content">
        <div class="template-detail" v-if="selectedTemplate">
          <v-list-item class="bg-transparent">
            <template #prepend>
              <div class="template-header">
                <div class="editable-row">
                  <span v-if="!editingTitle" class="title" @click="startEdit('title')">
                    {{ draft.title }}
                    <v-icon class="ml-1">mdi-pencil</v-icon>
                  </span>
                  <v-text-field
                    v-else
                    v-model="draft.title"
                    density="compact"
                    variant="outlined"
                    class="title-input"
                    @keydown.enter.prevent="finishEdit('title')"
                    @blur="finishEdit('title')"
                  />
                </div>
                <div class="editable-row">
                  <span v-if="!editingTemplateId" class="subtitle" @click="startEdit('templateId')">
                    {{ draft.templateId }}
                    <v-icon class="ml-1">mdi-pencil</v-icon>
                  </span>
                  <v-text-field
                    v-else
                    v-model="draft.templateId"
                    density="compact"
                    variant="outlined"
                    class="id-input"
                    @keydown.enter.prevent="finishEdit('templateId')"
                    @blur="finishEdit('templateId')"
                  />
                </div>
              </div>
            </template>
            <template #append>
              <div class="toolbar-actions">
                <v-btn class="close-button" @click="tryCloseTemplate">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
          <div class="template-grid" ref="gridEl">
            <div class="pane left" :style="{ flex: `0 0 ${Math.round(leftWidth*100)}%` }">
              <div class="pane-title">Template (Handlebars)</div>
              <CodeEditor v-model="draft.templateBody" language="handlebars" class="editor" />
            </div>
            <div class="splitter vertical" @mousedown="startDrag('vertical', $event)"></div>
            <div class="right-col" ref="rightColEl">
              <div class="pane right-top" :style="{ flex: `0 0 ${(topHeight*100).toFixed(2)}%` }">
                <div class="pane-title">Test Data (JSON)</div>
                <CodeEditor v-model="draft.testData" language="json" class="editor" />
              </div>
              <div class="splitter horizontal" @mousedown="startDrag('horizontal', $event)"></div>
              <div class="pane right-bottom">
                <div class="pane-title">Preview</div>
                <div class="rendered">
                  <RenderedPreview :html="renderedHtml" :full-height="true" />
                </div>
              </div>
            </div>
          </div>
          <div class="action-bar">
            <v-switch
              v-model="hbStrict"
              color="primary"
              hide-details
              density="compact"
              inset
              class="mr-2"
              :label="`Strict`"
            />
            <v-spacer></v-spacer>
            <v-btn class="bg-light-blue-darken-4" :disabled="!isDirty" @click="saveDraft">Save</v-btn>
          </div>
        </div>
        <div v-else class="template-empty">
          <em>Select a template to edit.</em>
        </div>
        <v-dialog v-model="confirmClose" max-width="420">
          <v-card class="pa-3">
            <div class="text-h6 mb-2">Discard changes?</div>
            <div class="mb-4">You have unsaved changes. Are you sure you want to close?</div>
            <div class="d-flex justify-end" style="gap: 8px;">
              <v-btn variant="text" @click="confirmClose=false">No</v-btn>
              <v-btn class="bg-red-darken-4" @click="discardAndClose">Yes</v-btn>
            </div>
          </v-card>
        </v-dialog>
      </main>
    </div>

    <div class="bottom-tabs">
      <button
        class="tab"
        :class="{ active: mainTab === 'messages' }"
        @click="mainTab = 'messages'"
      >
        Messages
      </button>
      <button
        class="tab"
        :class="{ active: mainTab === 'templates' }"
        @click="mainTab = 'templates'"
      >
        Templates
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import * as Handlebars from 'handlebars';
import dayjs from 'dayjs';
import { storeToRefs } from "pinia";
import { useMessagesStore, type MailMessage } from "./stores/messages";
import { useTemplatesStore, type TemplateItem as UITemplateItem } from "./stores/templates";
import MessageList from "./components/MessageList.vue";
import TemplateList from "./components/TemplateList.vue";
import CodeEditor from "./components/CodeEditor.vue";
import RenderedPreview from "./components/RenderedPreview.vue";

const store = useMessagesStore();
const {messages} = storeToRefs(store);
const templateStore = useTemplatesStore();
const { templates } = storeToRefs(templateStore);
const selected = ref<MailMessage | null>(null);
const tab = ref("");
const copied = ref(false);
const mainTab = ref<'messages' | 'templates'>('messages');
const selectedTemplate = ref<UITemplateItem | null>(null);
const confirmClose = ref(false);
const draft = ref<{ title: string; templateId: string; templateBody: string; testData: string }>({ title: '', templateId: '', templateBody: '', testData: '' });
const editingTitle = ref(false);
const editingTemplateId = ref(false);
const gridEl = ref<HTMLElement | null>(null);
const rightColEl = ref<HTMLElement | null>(null);
const leftWidth = ref(0.5); // fraction [0.2, 0.8]
const topHeight = ref(0.2); // fraction [min,max]
const dragging = ref<null | 'vertical' | 'horizontal'>(null);

// Register SendGrid-like helpers once
let __sg_helpers_registered = false;
function registerSendGridLikeHelpers() {
  if (__sg_helpers_registered) return;
  __sg_helpers_registered = true;

  function makeBlockOrInline(fn: (...args: any[]) => boolean) {
    return function(this: any, ...args: any[]) {
      const maybeOptions = args[args.length - 1];
      if (maybeOptions && typeof maybeOptions === 'object' && 'fn' in maybeOptions) {
        const options = maybeOptions as Handlebars.HelperOptions;
        const res = fn.apply(this, args.slice(0, -1));
        return res ? options.fn(this) : options.inverse(this);
      }
      return fn.apply(this, args);
    } as Handlebars.HelperDelegate;
  }

  Handlebars.registerHelper('eq', makeBlockOrInline((a, b) => a == b));
  Handlebars.registerHelper('ne', makeBlockOrInline((a, b) => a != b));
  Handlebars.registerHelper('strictEq', makeBlockOrInline((a, b) => a === b));
  Handlebars.registerHelper('strictNe', makeBlockOrInline((a, b) => a !== b));
  Handlebars.registerHelper('gt', makeBlockOrInline((a: any, b: any) => a > b));
  Handlebars.registerHelper('gte', makeBlockOrInline((a: any, b: any) => a >= b));
  Handlebars.registerHelper('lt', makeBlockOrInline((a: any, b: any) => a < b));
  Handlebars.registerHelper('lte', makeBlockOrInline((a: any, b: any) => a <= b));

  Handlebars.registerHelper('and', function(...args: any[]) {
    const vals = args.slice(0, -1);
    return vals.every(Boolean);
  });
  Handlebars.registerHelper('or', function(...args: any[]) {
    const vals = args.slice(0, -1);
    return vals.some(Boolean);
  });
  Handlebars.registerHelper('not', (v: any) => !v);

  Handlebars.registerHelper('math', (l: any, op: string, r: any) => {
    const a = Number(l); const b = Number(r);
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 0 : a / b;
      case '%': return b === 0 ? 0 : a % b;
      default: return NaN;
    }
  });

  Handlebars.registerHelper('uppercase', (s: any) => String(s ?? '').toUpperCase());
  Handlebars.registerHelper('lowercase', (s: any) => String(s ?? '').toLowerCase());
  Handlebars.registerHelper('capitalize', (s: any) => {
    const str = String(s ?? '');
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  Handlebars.registerHelper('replace', (s: any, search: any, repl: any) => String(s ?? '').split(String(search ?? '')).join(String(repl ?? '')));

  Handlebars.registerHelper('length', (v: any) => (v?.length ?? (typeof v === 'object' && v ? Object.keys(v).length : 0)));
  Handlebars.registerHelper('contains', (h: any, n: any) => {
    if (Array.isArray(h)) return h.includes(n);
    const hs = String(h ?? '');
    return hs.includes(String(n ?? ''));
  });
  Handlebars.registerHelper('join', (arr: any, sep: any) => Array.isArray(arr) ? arr.join(String(sep ?? ', ')) : '');
  Handlebars.registerHelper('default', (val: any, fallback: any) => (val === undefined || val === null || val === '') ? fallback : val);
  Handlebars.registerHelper('json', (v: any, spaces?: any) => JSON.stringify(v, null, Number(spaces ?? 0)));
  Handlebars.registerHelper('formatDate', (value: any, fmt?: any) => {
    const d = dayjs(value);
    if (!d.isValid()) return '';
    return d.format(String(fmt ?? 'YYYY-MM-DD HH:mm'));
  });
}
registerSendGridLikeHelpers();

const hbStrict = ref(false);

const isDirty = computed(() => {
  if (!selectedTemplate.value) return false;
  return (
    draft.value.title !== (selectedTemplate.value.title ?? '') ||
    draft.value.templateId !== (selectedTemplate.value.templateId ?? '') ||
    draft.value.templateBody !== (selectedTemplate.value.templateBody ?? '') ||
    (draft.value.testData ?? '') !== (selectedTemplate.value.testData ?? '')
  );
});
const renderedHtml = computed(() => {
  try {
    const data = draft.value.testData?.trim() ? JSON.parse(draft.value.testData) : {};
    const tpl = draft.value.templateBody ?? '';
    return renderWithHandlebars(tpl, data, { strict: hbStrict.value });
  } catch (e) {
    return `<pre style="color:#f88;">Invalid JSON in Test Data</pre>`;
  }
});

type TabInfo = {
  label: string;
  value: string;
  type: string;
  data: any;
  templateId?: string;
};

const tabs = computed<TabInfo[]>(() => {
  if (!selected.value) return [];
  const p: any = selected.value.payload;
  const result: TabInfo[] = [];

  // dynamic template data
  let dyn: any = null;
  if (Array.isArray(p.personalizations)) {
    for (const per of p.personalizations) {
      if (per.dynamic_template_data) {
        dyn = per.dynamic_template_data;
        break;
      }
    }
  }
  if (dyn) {
    result.push({
      label: "Template",
      value: "template",
      type: "template",
      data: dyn,
      templateId: p.template_id,
    });
  }

  // If this message references a template we have, render it with dynamic data
  if (dyn && p.template_id) {
    const tpl = templates.value?.find((t) => t.templateId === p.template_id);
    if (tpl?.templateBody) {
      try {
        const rendered = renderWithHandlebars(String(tpl.templateBody), dyn, { strict: false });
        result.push({
          label: "Rendered",
          value: "rendered",
          type: "rendered-template",
          data: rendered,
        });
      } catch {
        // ignore rendering errors
      }
    }
  }

  // content array
  const contents = Array.isArray(p.content) ? [...p.content] : [];
  let htmlContent: any = null;
  const others: any[] = [];
  for (const c of contents) {
    if (typeof c.type === "string" && c.type.includes("html")) {
      htmlContent = c;
    } else {
      others.push(c);
    }
  }

  if (htmlContent) {
    result.push({
      label: "HTML",
      value: "html",
      type: "html",
      data: htmlContent.value,
    });
  }

  for (const c of others) {
    const label = c.type === "text/plain" ? "Text" : c.type;
    result.push({
      label,
      value: label.toLowerCase(),
      type: c.type,
      data: c.value,
    });
  }

  if (htmlContent) {
    result.push({
      label: "HTML Source",
      value: "html-source",
      type: "html-source",
      data: htmlContent.value,
    });
  }

  result.push({
    label: "Raw",
    value: "raw",
    type: "raw",
    data: p,
  });

  return result;
});

watch(
  tabs,
  (newTabs) => {
    if (!newTabs.some(t => t.value === tab.value)) {
      tab.value = newTabs[0]?.value ?? "";
    }
  },
  { immediate: true, flush: 'post' }
);

watch(
  tab,
  (v) => {
    if (!v && tabs.value.length > 0) {
      tab.value = tabs.value[0].value;
    }
  },
  { flush: 'post' }
);

watch(
  messages,
  (newMessages) => {
    if (selected.value && !newMessages.some((m) => m.id === selected.value!.id)) {
      selected.value = null;
    }
  },
  { flush: 'post' }
);

onMounted(async () => {
  await store.load();
  store.connectSSE();
  // Ensure templates are available for conditional message rendering tab
  await templateStore.load();
  registerSendGridLikeHelpers();
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
});

watch(mainTab, async (v) => {
  if (v === 'templates') {
    await templateStore.load();
  }
});

async function selectMessage(m: MailMessage) {
  selected.value = m;
  await store.markRead(m.id);
}

async function deleteMessage(m: MailMessage) {
  await store.remove(m.id);
  if (selected.value?.id === m.id) {
    selected.value = null;
  }
}

async function addTemplate(payload: { title: string; templateId: string }) {
  await templateStore.add(payload.title, payload.templateId);
}

function selectTemplate(t: UITemplateItem) {
  selectedTemplate.value = t;
  draft.value = {
    title: t.title ?? '',
    templateId: t.templateId ?? '',
    templateBody: t.templateBody ?? '',
    testData: t.testData ?? '',
  };
  editingTitle.value = false;
  editingTemplateId.value = false;
}

async function deleteTemplate(t: UITemplateItem) {
  await templateStore.remove(t.id);
  if (selectedTemplate.value?.id === t.id) selectedTemplate.value = null;
}

function startEdit(field: 'title' | 'templateId') {
  if (field === 'title') editingTitle.value = true; else editingTemplateId.value = true;
}

function finishEdit(field: 'title' | 'templateId') {
  if (field === 'title') editingTitle.value = false; else editingTemplateId.value = false;
}

async function saveDraft() {
  if (!selectedTemplate.value) return;
  const id = selectedTemplate.value.id;
  const patch = { ...draft.value };
  await templateStore.update(id, patch);
}

function tryCloseTemplate() {
  if (isDirty.value) confirmClose.value = true; else discardAndClose();
}

function discardAndClose() {
  confirmClose.value = false;
  selectedTemplate.value = null;
}

async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch (err) {
    console.error("Failed to copy message ID", err);
  }
}

function pretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function allToEmails(msg: MailMessage) {
  return (msg.payload.personalizations ?? [])
      .flatMap((p: any) => (p.to ?? []).map((t: any) => t.email))
      .join(", ");
}

function allCcEmails(msg: MailMessage) {
  return (msg.payload.personalizations ?? [])
      .flatMap((p: any) => (p.cc ?? []).map((t: any) => t.email))
      .join(", ");
}

function allBccEmails(msg: MailMessage) {
  return (msg.payload.personalizations ?? [])
      .flatMap((p: any) => (p.bcc ?? []).map((t: any) => t.email))
      .join(", ");
}

function renderWithHandlebars(template: string, data: any, opts?: { strict?: boolean }): string {
  try {
    const compiled = Handlebars.compile(template, { noEscape: false, strict: !!opts?.strict });
    return compiled(data);
  } catch (err: any) {
    return `<pre style="color:#f88;">Handlebars error: ${escapeHtml(String(err?.message ?? err))}</pre>`;
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function startDrag(type: 'vertical' | 'horizontal', evt: MouseEvent) {
  evt.preventDefault();
  dragging.value = type;
}

function onDragMove(evt: MouseEvent) {
  if (!dragging.value) return;
  if (dragging.value === 'vertical') {
    const el = gridEl.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let frac = (evt.clientX - rect.left) / rect.width;
    frac = Math.min(0.8, Math.max(0.2, frac));
    leftWidth.value = frac;
  } else if (dragging.value === 'horizontal') {
    const el = rightColEl.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let frac = (evt.clientY - rect.top) / rect.height;
    // allow preview to take nearly full height by lowering min to 5%
    frac = Math.min(0.95, Math.max(0.05, frac));
    topHeight.value = frac;
  }
}

function onDragEnd() {
  dragging.value = null;
}

// removed local HTML source highlighter in favor of iframe preview only

</script>

<style scoped>
.message-detail {
  border: 1px solid #2c3e50;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.message-detail-header {
  display: flex;
  justify-content: space-between;
}

.message-detail-body {
  white-space: pre-wrap;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.close-button {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #fff;
}

.close-button:hover {
  color: #ff8080;
}

.tab-bar {
  background-color: transparent;
  margin-bottom: -1px; /* let tabs overlap content border by 1px */
}

.copy-icon {
  cursor: pointer;
}

.message-view {
  color: black;
  background-color: #B3B7BB;
  border: 1px solid var(--color-accent);
  border-radius: 10px; /* rounded on all corners */
  overflow: auto; /* allow scrolling for long content */
  flex: 1 1 auto; /* fill remaining space below header */
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.message-view :deep(.v-window__container) { height: 100%; }
.message-view :deep(.v-window-item) { height: 100%; }
.message-view :deep(.v-window-item__container) { height: 100%; display: flex; flex-direction: column; min-height: 0; }
.rendered-container { height: 100%; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }

.bottom-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-accent);
}

.bottom-tabs .tab {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-accent);
  border-top: none; /* flip to bottom-rounded tabs */
  padding: 0.25rem 0.75rem;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  cursor: pointer;
}
.bottom-tabs .tab.active {
  background: #2c3e50;
  font-weight: 700;
}

.template-detail {
  border: 1px solid #2c3e50;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.template-detail .title {
  font-weight: 600;
}
.template-detail .subtitle {
  color: #9aa5b1;
}
.template-editor-placeholder {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.template-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.editable-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.title-input, .id-input {
  min-width: 320px;
}
.toolbar-actions {
  display: flex;
  align-items: center;
}
.template-grid {
  margin-top: 8px;
  margin-right: 8px; /* pleasing right margin */
  margin-bottom: 8px; /* pleasing bottom margin */
  flex: 1 1 auto; /* take remaining space above action bar */
  display: flex;
  min-height: 0; /* allow children to size with flex */
}
.right-col {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
}
.pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.pane-title { font-size: 0.9rem; color: #9aa5b1; margin-bottom: 4px; }
.editor { flex: 1; overflow: auto; }
.rendered { flex: 1; overflow: auto; background: #ffffff; color: #000; border-radius: 4px; padding: 0; }
.rendered-frame { width: 100%; height: 100%; border: 0; background: #fff; }
.pane.right-bottom { flex: 1 1 0; }
.splitter.vertical { width: 6px; cursor: col-resize; background: #2c3e50; margin: 0 4px; position: relative; }
.splitter.horizontal { height: 6px; cursor: row-resize; background: #2c3e50; margin: 4px 0; position: relative; }
.splitter.vertical::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 3px; height: 3px;
  background: #b0b0b0; border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 -5px 0 #b0b0b0, 0 5px 0 #b0b0b0; /* three stacked dots */
}
.splitter.horizontal::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 3px; height: 3px;
  background: #b0b0b0; border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: -5px 0 0 #b0b0b0, 5px 0 0 #b0b0b0; /* three side-by-side dots */
}

/* Make v-textarea fill its container and show scrollbars */
.editor :deep(.v-input) { height: 100%; display: flex; flex-direction: column; }
.editor :deep(.v-input__control) { flex: 1; min-height: 0; }
.editor :deep(.v-field) { height: 100%; }
.editor :deep(.v-field__input) { height: 100%; overflow: auto; }
.editor :deep(textarea) { height: 100% !important; resize: none; overflow: auto !important; }

.action-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-accent);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Folder-style top tabs for message viewer */
.tab-bar :deep(.v-tab) {
  text-transform: none;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-accent);
  border-bottom: none;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  margin-right: 6px;
  min-height: 32px;
  font-weight: 500;
}
.tab-bar :deep(.v-tab--selected) {
  background: #2c3e50;
  font-weight: 700;
  margin-bottom: -1px; /* overlap content panel border */
  position: relative;
  z-index: 2;
}
</style>
