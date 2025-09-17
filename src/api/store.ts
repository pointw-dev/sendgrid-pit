import type { Response } from "express";
import { MailMessage } from "./types.js";
import { createMessageRepository } from "./repository/index.js";

type SSEClient = Response;
const clients: Set<SSEClient> = new Set();
const repository = await createMessageRepository();

export function addClient(res: SSEClient) {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

export async function getMessages() {
  return repository.getMessages();
}

export async function getMessageCount() {
  return repository.getMessageCount();
}

export async function addMessage(msg: MailMessage) {
  await repository.addMessage(msg);
  broadcast("message", msg);
}

export async function deleteMessage(id: string) {
  if (await repository.deleteMessage(id)) {
    broadcast("delete", { id });
  }
}

export async function setRead(id: string, read: boolean) {
  if (await repository.setRead(id, read)) {
    broadcast("update", { id, read });
  }
}

export async function clearMessages() {
  if (await repository.clearMessages()) {
    broadcast("clear", {});
  }
}

export async function markAllRead() {
  if (await repository.markAllRead()) {
    broadcast("all-read", {});
  }
}

function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}
