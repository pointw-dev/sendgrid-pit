import type { TemplateItem } from "../types.js";
import type { TemplateRepository } from "./Template.repository.base.js";

export class MemoryTemplateRepository implements TemplateRepository {
  private templates: TemplateItem[] = [];

  async getTemplates(): Promise<TemplateItem[]> {
    return this.templates
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addTemplate(tpl: TemplateItem): Promise<void> {
    this.templates.push(tpl);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.templates.splice(idx, 1);
      return true;
    }
    return false;
  }
}

