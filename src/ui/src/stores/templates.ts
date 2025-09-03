import { defineStore } from 'pinia';

export interface TemplateItem {
  id: string;
  title: string;
  templateId: string;
  templateBody: string;
  subject?: string;
  createdAt: string;
  testData?: string;
}

export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    templates: [] as TemplateItem[],
    loaded: false,
  }),
  actions: {
    async load() {
      if (this.loaded) return;
      const res = await fetch('/api/templates');
      const data = (await res.json()) as TemplateItem[];
      this.templates = data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.loaded = true;
    },
    async add(title: string, templateId: string, subject?: string) {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, templateId, templateBody: '', subject: subject ?? '', testData: '' }),
      });
      if (!res.ok) throw new Error('Failed to create template');
      const tpl = (await res.json()) as TemplateItem;
      this.templates.unshift(tpl);
      return tpl;
    },
    async remove(id: string) {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      this.templates = this.templates.filter((t) => t.id !== id);
    },
    async update(id: string, patch: Partial<TemplateItem>) {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update template');
      const tpl = this.templates.find((t) => t.id === id);
      if (tpl) Object.assign(tpl, patch);
    },
  },
});
