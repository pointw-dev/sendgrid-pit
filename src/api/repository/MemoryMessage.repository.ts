import type { MailMessage } from "../types.js";
import type { MessageRepository } from "./Message.repository.base.js";

export class MemoryMessageRepository implements MessageRepository {
  private messages: MailMessage[] = [];

  async getMessages(): Promise<MailMessage[]> {
    console.log('memory getMessages()')
    return this.messages
      .slice()
      .sort(
        (a, b) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
  }

  async addMessage(msg: MailMessage): Promise<void> {
    console.log('memory addMessage()')
    this.messages.push(msg);
  }

  async deleteMessage(id: string): Promise<boolean> {
    console.log('memory deleteMessage()')
    const idx = this.messages.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.messages.splice(idx, 1);
      return true;
    }
    return false;
  }

  async setRead(id: string, read: boolean): Promise<boolean> {
    console.log('memory setRead()')
    const msg = this.messages.find((m) => m.id === id);
    if (msg) {
      msg.read = read;
      return true;
    }
    return false;
  }

  async clearMessages(): Promise<boolean> {
    console.log('memory clearMessages()')
    if (this.messages.length) {
      this.messages.splice(0, this.messages.length);
      return true;
    }
    return false;
  }

  async markAllRead(): Promise<boolean> {
    console.log('memory markAllRead()')
    if (this.messages.length) {
      for (const m of this.messages) m.read = true;
      return true;
    }
    return false;
  }
}
