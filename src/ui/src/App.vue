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
          <div class="template-detail-header">
            <div class="title">{{ selectedTemplate.title }}</div>
            <div class="subtitle">{{ selectedTemplate.templateId }}</div>
          </div>
          <div class="template-editor-placeholder">
            Template editor coming soon.
          </div>
        </div>
        <div v-else class="template-empty">
          <em>Select a template to edit.</em>
        </div>
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
import { ref, onMounted, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMessagesStore, type MailMessage } from "./stores/messages";
import { useTemplatesStore, type TemplateItem as UITemplateItem } from "./stores/templates";
import MessageList from "./components/MessageList.vue";
import TemplateList from "./components/TemplateList.vue";

const store = useMessagesStore();
const {messages} = storeToRefs(store);
const templateStore = useTemplatesStore();
const { templates } = storeToRefs(templateStore);
const selected = ref<MailMessage | null>(null);
const tab = ref("");
const copied = ref(false);
const mainTab = ref<'messages' | 'templates'>('messages');
const selectedTemplate = ref<UITemplateItem | null>(null);

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
}

async function deleteTemplate(t: UITemplateItem) {
  await templateStore.remove(t.id);
  if (selectedTemplate.value?.id === t.id) selectedTemplate.value = null;
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

</script>

<style scoped>
.message-detail {
  border: 1px solid #2c3e50;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
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
  background-color: #787068;
}

.copy-icon {
  cursor: pointer;
}

.message-view {
  color: black;
  background-color: #B3B7BB;
}

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
}

.template-detail {
  border: 1px solid #2c3e50;
  border-radius: 8px;
  padding: 1rem;
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
</style>
