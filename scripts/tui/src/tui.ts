
import prompts, { PromptObject } from "prompts";
import type { CliArgs, Provider } from "./types.js";
import { coerceList, tryParseJSON } from "./util.js";

export async function promptMissingArgs(partial: CliArgs): Promise<CliArgs> {
  // Build questions only for values that aren't already provided on the command line
  const qs: PromptObject[] = [];

  if (!partial.provider) {
    qs.push({
      type: 'select', name: 'provider', message: 'Provider', choices: [
        { title: 'SendGrid (real)', value: 'sendgrid' },
        { title: 'sendgrid-pit (compatible sandbox)', value: 'pit' },
      ]
    });
  }

  if (!partial.apiKey) {
    qs.push({ type: 'password', name: 'apiKey', message: 'API Key', validate: v => v ? true : 'Required' });
  }

  if (!partial.baseUrl) {
    qs.push({
      type: (prev, values) => (values.provider === 'pit' || partial.provider === 'pit') ? 'text' : null,
      name: 'baseUrl',
      message: 'Base URL for PIT (e.g. http://localhost:3000)',
      initial: 'http://localhost:3000'
    });
  }

  if (!partial.from) {
    qs.push({ type: 'text', name: 'from', message: 'From email', initial: process.env.FROM_EMAIL || '' , validate: v => /@/.test(v) || 'Enter a valid email' });
  }

  if (!partial.to) {
    qs.push({ type: 'text', name: 'to', message: 'To (comma-separated emails)' });
  }

  if (!partial.cc) {
    qs.push({ type: 'text', name: 'cc', message: 'Cc (comma-separated emails)', initial: '' });
  }

  if (!partial.bcc) {
    qs.push({ type: 'text', name: 'bcc', message: 'Bcc (comma-separated emails)', initial: '' });
  }

  // Choice between Template or Body
  if (!partial.templateId && !partial.html && !partial.text) {
    qs.push({
      type: 'select', name: 'mode', message: 'Email content', choices: [
        { title: 'Dynamic Template', value: 'template' },
        { title: 'Subject + Body (text/html)', value: 'body' }
      ], initial: 0
    });
  }

  // If using template
  qs.push({
    type: (prev, values) => {
      const usingTemplate = (!!partial.templateId) || (values.mode === 'template');
      return usingTemplate && !partial.templateId ? 'text' : null;
    },
    name: 'templateId', message: 'Template ID'
  });

  qs.push({
    type: (prev, values) => {
      const usingTemplate = (!!partial.templateId) || (values.mode === 'template');
      return usingTemplate && !partial.data ? 'text' : null;
    },
    name: 'data', message: 'dynamicTemplateData (JSON)', initial: '{}'
  });

  // If using body
  if (!partial.subject) {
    qs.push({
      type: (prev, values) => {
        const usingTemplate = (!!partial.templateId) || (values.mode === 'template');
        return usingTemplate ? 'text' : 'text'; // subject is allowed in both (used if template subject not set)
      },
      name: 'subject', message: 'Subject', initial: 'Test Email'
    });
  }

  if (!partial.text && !partial.templateId) {
    qs.push({
      type: (prev, values) => {
        const usingTemplate = (!!partial.templateId) || (values.mode === 'template');
        return usingTemplate ? null : 'text';
      },
      name: 'text', message: 'Text body (leave blank if using only HTML)', initial: ''
    });
  }

  if (!partial.html && !partial.templateId) {
    qs.push({
      type: (prev, values) => {
        const usingTemplate = (!!partial.templateId) || (values.mode === 'template');
        return usingTemplate ? null : 'text';
      },
      name: 'html', message: 'HTML body (leave blank to auto-generate from text)', initial: ''
    });
  }

  if (!partial.replyTo) {
    qs.push({ type: 'text', name: 'replyTo', message: 'Reply-To (optional)', initial: '' });
  }

  if (!partial.attachments) {
    qs.push({ type: 'text', name: 'attachments', message: 'Attachments (comma-separated file paths)', initial: '' });
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
