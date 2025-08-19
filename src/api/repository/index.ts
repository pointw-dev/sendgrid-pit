import { MongoClient } from "mongodb";
import type { MessageRepository } from "./Message.repository.base.js";
import { MemoryMessageRepository } from "./MemoryMessage.repository.js";
import { MongoMessageRepository } from "./MongoMessage.repository.js";
import type { MailMessage } from "../types.js";

export async function createMessageRepository(): Promise<MessageRepository> {
  const { MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTION_NAME } = process.env;
  if (MONGO_URI) {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const collection = client
      .db(MONGO_DB_NAME ?? 'sendgrid-pit')
      .collection<MailMessage>(MONGO_COLLECTION_NAME ?? 'messages');
    console.log('Saving messages to mongo')
    return new MongoMessageRepository(collection);
  }
  console.log('Saving messages in memory')
  return new MemoryMessageRepository();
}

export type { MessageRepository };
