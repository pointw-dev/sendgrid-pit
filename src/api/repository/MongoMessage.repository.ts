import { Collection } from "mongodb";
import type { MailMessage } from "../types.js";
import type { MessageRepository } from "./Message.repository.base.js";

export class MongoMessageRepository implements MessageRepository {
  constructor(private collection: Collection<MailMessage>) {}

  async getMessages(): Promise<MailMessage[]> {
    console.log('mongo getMessages()')
    return this.collection
      .find({}, { sort: { receivedAt: -1 } })
      .toArray();
  }

  async getMessageCount(): Promise<number> {
    return this.collection.countDocuments({});
  }

  async addMessage(msg: MailMessage): Promise<void> {
    console.log('mongo addMessage()')
    await this.collection.insertOne(msg);
  }

  async deleteMessage(id: string): Promise<boolean> {
    console.log('mongo deleteMessage()')
    const res = await this.collection.deleteOne({ id });
    return res.deletedCount > 0;
  }

  async setRead(id: string, read: boolean): Promise<boolean> {
    console.log('mongo setRead()')
    const res = await this.collection.updateOne({ id }, { $set: { read } });
    return res.matchedCount > 0;
  }

  async clearMessages(): Promise<boolean> {
    console.log('mongo clearMessages()')
    const res = await this.collection.deleteMany({});
    return res.deletedCount > 0;
  }

  async markAllRead(): Promise<boolean> {
    console.log('mongo markAllRead()')
    const res = await this.collection.updateMany(
      { read: { $ne: true } },
      { $set: { read: true } }
    );
    return res.modifiedCount > 0;
  }
}
