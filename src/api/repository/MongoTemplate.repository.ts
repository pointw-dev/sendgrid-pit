import { Collection } from "mongodb";
import type { TemplateItem } from "../types.js";
import type { TemplateRepository } from "./Template.repository.base.js";

export class MongoTemplateRepository implements TemplateRepository {
  constructor(private collection: Collection<TemplateItem>) {}

  async getTemplates(): Promise<TemplateItem[]> {
    return this.collection.find({}, { sort: { createdAt: -1 } }).toArray();
  }

  async addTemplate(tpl: TemplateItem): Promise<void> {
    await this.collection.insertOne(tpl);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const res = await this.collection.deleteOne({ id });
    return res.deletedCount > 0;
  }
}

