<template>
  <v-card class="message-list-item" @click="$emit('select', message)">
    <div class="item">
      <div class="left">
        <div class="line first">
          <v-icon class="pr-2">{{ message.read ? 'mdi-email-open' : 'mdi-email' }}</v-icon>
          <span :class="{ unread: !message.read }" class="truncate">{{ fromEmail }}</span>
        </div>
        <div class="line">
          <span class="label">To:</span>
          <span class="truncate">{{ toList }}</span>
        </div>
        <div class="line">
          <span class="truncate-2">{{ bodyPreview }}</span>
        </div>
      </div>
      <div class="right">
        <span class="time">{{ timeAgo }}</span>
        <v-btn class="bg-red-darken-4" size="x-small" @click.stop="$emit('delete', message)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useMessagesStore, type MailMessage } from "../stores/messages";

dayjs.extend(relativeTime);

const props = defineProps<{ message: MailMessage }>();
defineEmits<{ (e: 'select', msg: MailMessage): void; (e: 'delete', msg: MailMessage): void }>();

const store = useMessagesStore();

const fromEmail = computed(() => props.message?.payload?.from?.email ?? '');

const toList = computed(() => {
  try {
    return (props.message?.payload?.personalizations ?? [])
      .flatMap((p: any) => (p?.to ?? []).map((t: any) => t?.email))
      .filter(Boolean)
      .join(', ');
  } catch {
    return '';
  }
});

const bodyPreview = computed(() => {
  const p: any = props.message?.payload ?? {};
  if (p.template_id) return `{${p.template_id}}`;
  const content0 = Array.isArray(p.content) ? p.content[0] : undefined;
  return content0?.value ?? '';
});

const timeAgo = computed(() => {
  const d = new Date(props.message.receivedAt);
  return dayjs(d).from(store.now.value);
});
</script>

<style scoped>
.message-list-item {
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
  /* Fix right column width to avoid layout shift; customizable via CSS var */
  grid-template-columns: 1fr var(--message-right-width, 120px);
  column-gap: 8px;
  align-items: start;
}

.left {
  min-width: 0; /* allow inner truncation */
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  width: var(--message-right-width, 120px);
}

.right .time {
  /* Allow wrapping if the phrase gets unusually long */
  white-space: normal;
}

.line {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.label {
  color: #9aa5b1;
}

.truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  min-width: 0;
}

.unread {
  font-weight: bold;
  color: silver;
}
</style>
