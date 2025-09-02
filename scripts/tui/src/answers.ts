import fs from 'node:fs';
import path from 'node:path';
import type { CliArgs } from './types.js';

const ANSWERS_FILENAME = 'sendgrid-pit.answers.yml';

export function answersFilePath(cwd: string = process.cwd()): string {
  return path.resolve(cwd, ANSWERS_FILENAME);
}

export function loadAnswers(cwd?: string): Partial<CliArgs> {
  const fp = answersFilePath(cwd);
  if (!fs.existsSync(fp)) return {};
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    // YAML is a superset of JSON. We write JSON, so parse as JSON.
    return JSON.parse(raw) as Partial<CliArgs>;
  } catch {
    return {};
  }
}

export function saveAnswers(args: CliArgs, cwd?: string) {
  const fp = answersFilePath(cwd);
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Do not persist secrets by default
  const { apiKey: _omitApiKey, dryRun: _omitDry, ...rest } = args;
  // Persist only meaningful fields
  const toSave: Partial<CliArgs> = {
    provider: rest.provider,
    baseUrl: rest.baseUrl,
    from: rest.from,
    to: rest.to,
    cc: rest.cc,
    bcc: rest.bcc,
    subject: rest.subject,
    replyTo: rest.replyTo,
    templateId: rest.templateId,
    data: rest.data,
    text: rest.text,
    html: rest.html,
    attachments: rest.attachments,
  };

  fs.writeFileSync(fp, JSON.stringify(toSave, null, 2), 'utf8');
}

