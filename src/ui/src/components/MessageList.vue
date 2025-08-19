<template>
  <div v-if="messages.length === 0" class="message-list-empty">
    <em>No messages yet.</em>
  </div>
  <section v-else class="message-list">
    <div class="message-list-toolbar">
      <v-spacer></v-spacer>
      <v-btn
        class="bg-red-darken-4"
        size="x-small"
        prepend-icon="mdi-delete-sweep"
        @click="store.removeAll()"
      >
        Delete All
      </v-btn>
      <v-btn
        class="bg-light-blue-darken-4"
        size="x-small"
        prepend-icon="mdi-email-open"
        @click="store.markAllRead()"
      >
        Mark All Read
      </v-btn>
    </div>
    <div class="message-list-items">
      <v-card
        v-for="m in messages"
        :key="m.id"
        class="message-list-item"
        @click="$emit('select', m)"
      >
        <v-row>
          <v-col class="text-grey">
            <v-icon class="pr-2">{{ m.read? 'mdi-email-open' : 'mdi-email'}}</v-icon>
            <span :class="{ unread: !m.read }">{{ m.payload.from.email }}</span><br/>
            To: {{ allToEmails(m) }}<br/>
            {{ m.payload.template_id ? `\{${m.payload.template_id}\}` : m.payload.content[0].value }}
          </v-col>
          <v-col class="text-right">
            {{ timeAgo(m.receivedAt) }}<br/><br/>
            <v-btn
                class="bg-red-darken-4"
                size="x-small"
                @click="$emit('delete', m)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMessagesStore, type MailMessage } from "../stores/messages";

const store = useMessagesStore();


import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


defineProps<{ messages: MailMessage[] }>();

defineEmits<{
  (e: "select", msg: MailMessage): void;
  (e: "delete", msg: MailMessage): void;
}>();

let timer: number;

onMounted(() => {
  timer = window.setInterval(() => {
    store.setNow();
  }, 30000);
});

onUnmounted(() => {
  clearInterval(timer);
});

function timeAgo(date: string | number | Date) {
  const d = new Date(date);
  return dayjs(d).from(store.now.value);
}

function allToEmails(msg: MailMessage) {
  return (msg.payload.personalizations ?? [])
    .flatMap((p: any) => (p.to ?? []).map((t: any) => t.email))
    .join(", ");
}

function pretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
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

.message-list-item {
  background-color: #0d1b2a;
  color: white;
  border: 1px solid #2c3e50;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.unread {
  font-weight: bold;
  color: silver;
}

.message-list-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-list-item-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}

.delete-button:hover {
  color: #ff8080;
}

.message-list-item-body {
  white-space: pre-wrap;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}
</style>
