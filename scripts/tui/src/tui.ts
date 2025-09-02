
import prompts, { PromptObject } from "prompts";
import type { CliArgs, Provider } from "./types.js";
import { coerceList, tryParseJSON } from "./util.js";
import { editInExternalEditor } from './editor.js';

export async function promptMissingArgs(partial: CliArgs, options?: { askAll?: boolean }): Promise<CliArgs> {
  const askAll = Boolean(options?.askAll);
  // Build questions only for values that aren't already provided on the command line
  const qs: PromptObject[] = [];

  // Phase 1: Provider selection (ask first)
  let providerNow: Provider | undefined = partial.provider;
  if (askAll || !providerNow) {
    const initialIndex = (partial.provider === 'pit') ? 1 : 0;
    const ans = await prompts({
      type: 'select', name: 'provider', message: 'Provider', choices: [
        { title: 'SendGrid (real)', value: 'sendgrid' },
        { title: 'sendgrid-pit (compatible sandbox)', value: 'pit' },
      ], initial: initialIndex
    }, { onCancel: () => { process.exit(1); } });
    providerNow = ans.provider as Provider;
  }
  if (!providerNow) providerNow = partial.provider as Provider | undefined;

  // Phase 2: API key immediately after provider
  let apiKeyAnswer: string | undefined = partial.apiKey;
  if (providerNow === 'sendgrid') {
    const envKey = process.env.SENDGRID_API_KEY;
    if (askAll || (!partial.apiKey && !envKey)) {
      const msg = envKey ? 'API Key (using SENDGRID_API_KEY)' : 'API Key';
      const ak = await prompts({
        type: 'password',
        name: 'apiKey',
        message: msg,
        initial: envKey || '',
        validate: (v: string) => v ? true : 'Required'
      }, { onCancel: () => { process.exit(1); } });
      apiKeyAnswer = ak.apiKey || envKey || apiKeyAnswer;
    } else {
      apiKeyAnswer = partial.apiKey || process.env.SENDGRID_API_KEY;
    }
  } else if (providerNow === 'pit') {
    if (askAll || !partial.apiKey) {
      const ak = await prompts({
        type: 'text',
        name: 'apiKey',
        message: 'API Key for PIT (optional)',
        initial: partial.apiKey || process.env.SENDGRID_API_KEY || ''
      }, { onCancel: () => { process.exit(1); } });
      apiKeyAnswer = ak.apiKey || '';
    }
  }

  if (providerNow === 'pit' && (askAll || !partial.baseUrl)) {
    qs.push({
      type: 'text',
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

  // dynamic data is captured via multiline editor below

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

  // html body is captured via multiline editor below

  if (askAll || !partial.replyTo) {
    qs.push({ type: 'text', name: 'replyTo', message: 'Reply-To (optional)', initial: partial.replyTo ?? '' });
  }

  if (askAll || !partial.attachments) {
    qs.push({ type: 'text', name: 'attachments', message: 'Attachments (comma-separated file paths)', initial: (partial.attachments || []).join(', ') });
  }

  const answers = qs.length ? await prompts(qs, { onCancel: () => { process.exit(1); } }) : {};

  // Multiline editors (HTML and dynamic data) via external $EDITOR
  const usingTemplateNow = (() => {
    if (answers.mode) return answers.mode === 'template';
    return defaultMode === 'template';
  })();

  // Ask API key based on provider selection
  // providerNow and apiKeyAnswer already determined above

  // dynamicTemplateData editor
  let editedData: string | undefined;
  if (usingTemplateNow && (askAll || !partial.data)) {
    const initial = partial.data ? JSON.stringify(partial.data, null, 2) : '{}';
    await waitForEnter('Hit Enter to launch your editor to supply the Dynamic Template Data (JSON). Save and close to finish.');
    editedData = editInExternalEditor('dynamicTemplateData (JSON)', initial, '.json');
  }

  // HTML editor
  let editedHtml: string | undefined;
  if (!usingTemplateNow && (askAll || !partial.html)) {
    await waitForEnter('Hit Enter to launch your editor to supply the HTML body. Save and close to finish.');
    editedHtml = editInExternalEditor('HTML body', partial.html ?? '', '.html');
  }

  const merged: CliArgs = {
    ...partial,
    provider: providerNow as Provider,
    apiKey: apiKeyAnswer ?? partial.apiKey,
    baseUrl: answers.baseUrl ?? partial.baseUrl,
    from: answers.from ?? partial.from,
    to: coerceList(answers.to ?? (partial.to as any)) as string[] | undefined,
    cc: coerceList(answers.cc ?? (partial.cc as any)) as string[] | undefined,
    bcc: coerceList(answers.bcc ?? (partial.bcc as any)) as string[] | undefined,
    subject: answers.subject ?? partial.subject,
    templateId: answers.templateId ?? partial.templateId,
    data: editedData ? tryParseJSON<Record<string, unknown>>(editedData) ?? partial.data : partial.data,
    text: answers.text ?? partial.text,
    html: editedHtml ?? partial.html,
    replyTo: answers.replyTo ?? partial.replyTo,
    attachments: coerceList(answers.attachments ?? (partial.attachments as any)) as string[] | undefined
  };

  return merged;
}

// external editor used; inline editor removed

async function waitForEnter(message: string): Promise<void> {
  await prompts({ type: 'text', name: 'ok', message, initial: '' }, { onCancel: () => { process.exit(1); } });
}
