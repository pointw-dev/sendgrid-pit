
import prompts, { PromptObject } from "prompts";
import type { CliArgs, Provider } from "./types.js";
import { coerceList, tryParseJSON } from "./util.js";

export async function promptMissingArgs(partial: CliArgs, options?: { askAll?: boolean }): Promise<CliArgs> {
  const askAll = Boolean(options?.askAll);
  // Build questions only for values that aren't already provided on the command line
  const qs: PromptObject[] = [];

  if (askAll || !partial.provider) {
    const initialIndex = (partial.provider === 'pit') ? 1 : 0;
    qs.push({
      type: 'select', name: 'provider', message: 'Provider', choices: [
        { title: 'SendGrid (real)', value: 'sendgrid' },
        { title: 'sendgrid-pit (compatible sandbox)', value: 'pit' },
      ], initial: initialIndex
    });
  }

  if (askAll || !partial.apiKey) {
    qs.push({ type: 'password', name: 'apiKey', message: 'API Key', validate: (v: string) => v ? true : 'Required' });
  }

  if (askAll || !partial.baseUrl) {
    qs.push({
      type: (prev: unknown, values: any) => (values.provider === 'pit' || partial.provider === 'pit') ? 'text' : null,
      name: 'baseUrl',
      message: 'Base URL for PIT (e.g. http://localhost:8825)',
      initial: partial.baseUrl || 'http://localhost:8825'
    });
  }

  if (askAll || !partial.from) {
    qs.push({ type: 'text', name: 'from', message: 'From email', initial: partial.from || process.env.FROM_EMAIL || '' , validate: (v: string) => /@/.test(v) || 'Enter a valid email' });
  }

  if (askAll || !partial.to) {
    qs.push({ type: 'text', name: 'to', message: 'To (comma-separated emails)', initial: (partial.to || []).join(', ') });
  }

  if (askAll || !partial.cc) {
    qs.push({ type: 'text', name: 'cc', message: 'Cc (comma-separated emails)', initial: (partial.cc || []).join(', ') });
  }

  if (askAll || !partial.bcc) {
    qs.push({ type: 'text', name: 'bcc', message: 'Bcc (comma-separated emails)', initial: (partial.bcc || []).join(', ') });
  }

  // Choice between Template or Body
  const defaultMode = partial.templateId ? 'template' : 'body';
  if (askAll || (!partial.templateId && !partial.html && !partial.text)) {
    qs.push({
      type: 'select', name: 'mode', message: 'Email content', choices: [
        { title: 'Dynamic Template', value: 'template' },
        { title: 'Subject + Body (text/html)', value: 'body' }
      ], initial: defaultMode === 'template' ? 0 : 1
    });
  }

  // If using template
  if (askAll || !partial.templateId) {
    qs.push({
      type: (prev: unknown, values: any) => {
        const usingTemplate = (values.mode ? values.mode === 'template' : defaultMode === 'template');
        return usingTemplate ? 'text' : null;
      },
      name: 'templateId', message: 'Template ID', initial: partial.templateId || ''
    });
  }

  if (askAll || !partial.data) {
    qs.push({
      type: (prev: unknown, values: any) => {
        const usingTemplate = (values.mode ? values.mode === 'template' : defaultMode === 'template');
        return usingTemplate ? 'text' : null;
      },
      name: 'data', message: 'dynamicTemplateData (JSON)', initial: partial.data ? JSON.stringify(partial.data) : '{}'
    });
  }

  // If using body
  if (askAll || !partial.subject) {
    qs.push({
      type: (prev: unknown, values: any) => 'text',
      name: 'subject', message: 'Subject', initial: partial.subject ?? 'Test Email'
    });
  }

  if (askAll || (!partial.text && !partial.templateId)) {
    qs.push({
      type: (prev: unknown, values: any) => {
        const usingTemplate = (values.mode ? values.mode === 'template' : defaultMode === 'template');
        return usingTemplate ? null : 'text';
      },
      name: 'text', message: 'Text body (leave blank if using only HTML)', initial: partial.text ?? ''
    });
  }

  if (askAll || (!partial.html && !partial.templateId)) {
    qs.push({
      type: (prev: unknown, values: any) => {
        const usingTemplate = (values.mode ? values.mode === 'template' : defaultMode === 'template');
        return usingTemplate ? null : 'text';
      },
      name: 'html', message: 'HTML body (leave blank to auto-generate from text)', initial: partial.html ?? ''
    });
  }

  if (askAll || !partial.replyTo) {
    qs.push({ type: 'text', name: 'replyTo', message: 'Reply-To (optional)', initial: partial.replyTo ?? '' });
  }

  if (askAll || !partial.attachments) {
    qs.push({ type: 'text', name: 'attachments', message: 'Attachments (comma-separated file paths)', initial: (partial.attachments || []).join(', ') });
  }

  const answers = qs.length ? await prompts(qs, { onCancel: () => { process.exit(1); } }) : {};

  const merged: CliArgs = {
    ...partial,
    provider: (answers.provider ?? partial.provider) as Provider,
    apiKey: answers.apiKey ?? partial.apiKey,
    baseUrl: answers.baseUrl ?? partial.baseUrl,
    from: answers.from ?? partial.from,
    to: coerceList(answers.to ?? (partial.to as any)) as string[] | undefined,
    cc: coerceList(answers.cc ?? (partial.cc as any)) as string[] | undefined,
    bcc: coerceList(answers.bcc ?? (partial.bcc as any)) as string[] | undefined,
    subject: answers.subject ?? partial.subject,
    templateId: answers.templateId ?? partial.templateId,
    data: tryParseJSON<Record<string, unknown>>(answers.data) ?? partial.data,
    text: answers.text ?? partial.text,
    html: answers.html ?? partial.html,
    replyTo: answers.replyTo ?? partial.replyTo,
    attachments: coerceList(answers.attachments ?? (partial.attachments as any)) as string[] | undefined
  };

  return merged;
}
