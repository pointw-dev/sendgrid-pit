<template>
  <div v-if="messages.length === 0" class="message-list-empty">
    <em>No messages yet.</em>
  </div>
  <section v-else class="message-list">
    <div class="message-list-toolbar">
      <div class="message-count">{{ messages.length }} messages</div>
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
      <MessageItem
        v-for="m in messages"
        :key="m.id"
        :message="m"
        @select="$emit('select', m)"
        @delete="$emit('delete', m)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useMessagesStore, type MailMessage } from "../stores/messages";
import MessageItem from './MessageItem.vue';

const store = useMessagesStore();

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
.message-count {
  font-size: 10px;
  opacity: 0.7;
  align-self: center;
}
.message-list-items {
  list-style: none;
  font-size: 9pt;
  padding: 0;
  margin: 0;
}

.unread {
  font-weight: bold;
  color: silver;
}
</style>
