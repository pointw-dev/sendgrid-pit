import { defineStore } from "pinia";

export interface MailMessage {
  id: string;
  receivedAt: string;
  payload: unknown;
  read: boolean;
}

export const useMessagesStore = defineStore("messages", {
  state: () => ({
    messages: [] as MailMessage[],
    connected: false,
    now: Date.now()
  }),
  actions: {
    async load() {
      const res = await fetch("/api/messages");
      const data = (await res.json()) as MailMessage[];
      this.messages = data
        .map((m) => ({ ...m, read: m.read ?? false }))
        .sort(
          (a, b) =>
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
    },
    connectSSE() {
      if (this.connected) return;
      const es = new EventSource("/events");
      es.addEventListener("message", (evt) => {
        this.setNow();
        try {
          const msg = JSON.parse((evt as MessageEvent).data) as MailMessage;
          this.messages.unshift({ ...msg, read: msg.read ?? false });
        } catch {
          // ignore malformed packets
        }
      });
      es.addEventListener("delete", (evt) => {
        try {
          const { id } = JSON.parse((evt as MessageEvent).data) as {
            id: string;
          };
          this.messages = this.messages.filter((m) => m.id !== id);
        } catch {
          // ignore malformed packets
        }
      });
      es.addEventListener("update", (evt) => {
        try {
          const { id, read } = JSON.parse((evt as MessageEvent).data) as {
            id: string;
            read: boolean;
          };
          const msg = this.messages.find((m) => m.id === id);
          if (msg) msg.read = read;
        } catch {
          // ignore malformed packets
        }
      });
      es.addEventListener("clear", () => {
        this.messages = [];
      });
      es.addEventListener("all-read", () => {
        this.messages.forEach((m) => (m.read = true));
      });
      es.onerror = () => {
        // Let the browser auto-reconnect; could add backoff if desired
      };
      this.connected = true;
    },
    async remove(id: string) {
      await fetch(`/api/messages/${id}`, { method: "DELETE" });
      this.messages = this.messages.filter((m) => m.id !== id);
    },
    async markRead(id: string, read = true) {
      await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read })
      });
      const msg = this.messages.find((m) => m.id === id);
      if (msg) msg.read = read;
    },
    async removeAll() {
      await fetch(`/api/messages`, { method: "DELETE" });
      this.messages = [];
    },
    async markAllRead() {
      await fetch(`/api/messages/mark-all-read`, { method: "POST" });
      this.messages.forEach((m) => (m.read = true));
    },
    setNow() {
      this.now = Date.now();
    }
  },
  getters: {
    unreadCount: (state) => state.messages.filter((m) => !m.read).length
  }
});
