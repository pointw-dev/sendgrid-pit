import type { MailMessage } from "../types.js";

export interface MessageRepository {
  getMessages(): Promise<MailMessage[]>;
  getMessageCount(): Promise<number>;
  addMessage(msg: MailMessage): Promise<void>;
  deleteMessage(id: string): Promise<boolean>;
  setRead(id: string, read: boolean): Promise<boolean>;
  clearMessages(): Promise<boolean>;
  markAllRead(): Promise<boolean>;
}
