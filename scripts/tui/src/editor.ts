import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function pickEditor(): string {
  const env = process.env.VISUAL || process.env.EDITOR;
  if (env && env.trim()) return env;
  if (process.platform === 'win32') return 'notepad';
  // Prefer nano if available, else vi
  return 'nano';
}

export function editInExternalEditor(title: string, initial: string, suffix = '.txt'): string {
  // Inform the user
  // eslint-disable-next-line no-console
  console.log(`\nOpening ${title} in your editor (${process.env.VISUAL || process.env.EDITOR || pickEditor()}). Save and close to finish...`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sendgrid-pit-'));
  const filePath = path.join(tmpDir, `edit${suffix}`);
  fs.writeFileSync(filePath, initial ?? '', 'utf8');

  const editor = pickEditor();
  const res = spawnSync(editor, [filePath], { stdio: 'inherit' });
  if (res.error) {
    throw new Error(`Failed to launch editor '${editor}': ${res.error.message}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return content;
}

