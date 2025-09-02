import type { TemplateItem } from "./types.js";
import { createTemplateRepository } from "./repository/index.js";

const repository = await createTemplateRepository();

export async function getTemplates() {
  return repository.getTemplates();
}

export async function addTemplate(tpl: TemplateItem) {
  await repository.addTemplate(tpl);
}

export async function deleteTemplate(id: string) {
  await repository.deleteTemplate(id);
}

