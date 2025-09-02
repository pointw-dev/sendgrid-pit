#!/usr/bin/env node


import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { promptMissingArgs } from "./tui.js";
import { buildPayload } from "./buildPayload.js";
import { sendMail } from "./providers.js";
import { loadAnswers, saveAnswers } from './answers.js';
import type { CliArgs, Provider } from "./types.js";

function arrayCoerce(x: unknown): string[] | undefined {
  if (x == null) return undefined;
  if (Array.isArray(x)) return x as string[];
  if (typeof x === 'string') return x.split(',').map(s => s.trim()).filter(Boolean);
  return undefined;
}

async function main() {
const argv = await yargs(hideBin(process.argv))
  .scriptName('sendgrid-cli')
  .usage('$0 [options]')
  .option('provider', { type: 'string', choices: ['sendgrid','pit'], describe: 'Choose real SendGrid or sendgrid-pit', default: (process.env.SEND_PROVIDER as Provider) || undefined })
  .option('api-key', { alias: 'k', type: 'string', describe: 'API key (SG or PIT token). Defaults to SENDGRID_API_KEY', default: process.env.SENDGRID_API_KEY })
  .option('base-url', { type: 'string', describe: 'Override SendGrid base URL (use PIT base URL here). Defaults to SENDGRID_BASE_URL' , default: process.env.SENDGRID_BASE_URL })
  .option('from', { type: 'string', describe: 'From email', default: process.env.FROM_EMAIL })
  .option('to', { type: 'array', describe: 'To recipients (comma-separated or repeated)', coerce: arrayCoerce })
  .option('cc', { type: 'array', describe: 'Cc recipients', coerce: arrayCoerce })
  .option('bcc', { type: 'array', describe: 'Bcc recipients', coerce: arrayCoerce })
  .option('subject', { type: 'string', describe: 'Subject (used for body mode or when template subject not set)' })
  .option('reply-to', { type: 'string', describe: 'Reply-To email' })
  .option('template-id', { type: 'string', describe: 'Dynamic template ID' })
  .option('data', { type: 'string', describe: 'dynamicTemplateData JSON (stringified)' })
  .option('text', { type: 'string', describe: 'Plain text body' })
  .option('html', { type: 'string', describe: 'HTML body' })
  .option('attachments', { type: 'array', describe: 'File paths (comma-separated or repeated)', coerce: arrayCoerce })
  .option('answers-file', { type: 'string', describe: 'Path to answers file (JSON)', default: process.env.SG_SENDER_ANSWERS || 'sg-sender.answers.json' })
  .option('defaults', { type: 'boolean', describe: 'Use saved defaults without prompting for them', default: false })
  .option('dry-run', { type: 'boolean', describe: 'Print payload and exit', default: false })
  .help()
  .parse();

// Load persisted defaults and merge with CLI/env-provided values (CLI wins)
const persisted = loadAnswers(undefined, argv['answers-file'] as string);
const partial: CliArgs = {
  ...persisted,
  provider: (argv.provider as Provider | undefined) ?? persisted.provider,
  apiKey: (argv["api-key"] as string | undefined) ?? (persisted.apiKey as string | undefined),
  baseUrl: (argv["base-url"] as string | undefined) ?? persisted.baseUrl,
  from: (argv.from as string | undefined) ?? persisted.from,
  to: (argv.to as string[] | undefined) ?? persisted.to,
  cc: (argv.cc as string[] | undefined) ?? persisted.cc,
  bcc: (argv.bcc as string[] | undefined) ?? persisted.bcc,
  subject: (argv.subject as string | undefined) ?? persisted.subject,
  replyTo: (argv["reply-to"] as string | undefined) ?? persisted.replyTo,
  templateId: (argv["template-id"] as string | undefined) ?? persisted.templateId,
  data: argv.data ? (() => { try { return JSON.parse(argv.data as string); } catch { return undefined; } })() : (persisted.data as any),
  text: (argv.text as string | undefined) ?? persisted.text,
  html: (argv.html as string | undefined) ?? persisted.html,
  attachments: (argv.attachments as string[] | undefined) ?? persisted.attachments,
  dryRun: argv["dry-run"],
};

// Launch TUI only for missing pieces
const args = await promptMissingArgs(partial, { askAll: !argv.defaults });

const payload = buildPayload(args);

// Persist answers for future runs (exclude apiKey for safety)
try { saveAnswers(args, undefined, argv['answers-file'] as string); } catch { /* ignore */ }

if (args.dryRun) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const provider = (args.provider ?? 'sendgrid') as Provider;
const apiKey = args.apiKey || process.env.SENDGRID_API_KEY;
if (!apiKey) {
  // eslint-disable-next-line no-console
  console.error('API key is required. Provide --api-key or set SENDGRID_API_KEY.');
  process.exit(1);
}

const res = await sendMail(provider, apiKey, payload, args.baseUrl);

if (res.ok) {
  // eslint-disable-next-line no-console
  console.log(`✅ Sent! status=${res.status}${res.id ? ` id=${res.id}` : ''}`);
} else {
  // eslint-disable-next-line no-console
  console.error(`❌ Failed: status=${res.status}`, res.details ?? '');
  process.exit(1);
}
}

void main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
