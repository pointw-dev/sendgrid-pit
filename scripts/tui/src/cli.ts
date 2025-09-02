#!/usr/bin/env node


import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { promptMissingArgs } from "./tui.js";
import { buildPayload } from "./buildPayload.js";
import { sendMail } from "./providers.js";
import type { CliArgs, Provider } from "./types.js";

function arrayCoerce(x: unknown): string[] | undefined {
  if (x == null) return undefined;
  if (Array.isArray(x)) return x as string[];
  if (typeof x === 'string') return x.split(',').map(s => s.trim()).filter(Boolean);
  return undefined;
}

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
  .option('dry-run', { type: 'boolean', describe: 'Print payload and exit', default: false })
  .help()
  .parse();

const partial: CliArgs = {
  provider: argv.provider as Provider | undefined,
  apiKey: argv["api-key"],
  baseUrl: argv["base-url"],
  from: argv.from,
  to: argv.to as string[] | undefined,
  cc: argv.cc as string[] | undefined,
  bcc: argv.bcc as string[] | undefined,
  subject: argv.subject,
  replyTo: argv["reply-to"],
  templateId: argv["template-id"],
  data: argv.data ? (() => { try { return JSON.parse(argv.data as string); } catch { return undefined; } })() : undefined,
  text: argv.text,
  html: argv.html,
  attachments: argv.attachments as string[] | undefined,
  dryRun: argv["dry-run"]
};

// Launch TUI only for missing pieces
const args = await promptMissingArgs(partial);

const payload = buildPayload(args);

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
