
import fs from "node:fs";
import path from "node:path";

export function coerceList(value?: string | string[]): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.flatMap(v => v.split(",").map(s => s.trim()).filter(Boolean));
  return value.split(",").map(s => s.trim()).filter(Boolean);
}

export function tryParseJSON<T = any>(input?: string): T | undefined {
  if (!input) return undefined;
  try { return JSON.parse(input) as T; } catch { return undefined; }
}

export function htmlToText(html: string): string {
  // super-lightweight strip; good enough for defaults
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function textToHtml(text: string): string {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<pre>${safe}</pre>`;
}

export function readAttachment(fp: string) {
  const abs = path.resolve(fp);
  const buf = fs.readFileSync(abs);
  const content = buf.toString("base64");
  return { content, filename: path.basename(abs) };
}
