import type { TemplateItem } from "../types.js";

export interface TemplateRepository {
  getTemplates(): Promise<TemplateItem[]>;
  addTemplate(tpl: TemplateItem): Promise<void>;
  deleteTemplate(id: string): Promise<boolean>;
  updateTemplate(id: string, patch: Partial<TemplateItem>): Promise<boolean>;
}
