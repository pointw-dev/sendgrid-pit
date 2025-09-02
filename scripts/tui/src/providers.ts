
import axios from "axios";
import type { BuiltMailPayload, Provider } from "./types.js";

export interface SendResult { ok: boolean; status: number; id?: string; details?: unknown }

export async function sendMail(
  provider: Provider,
  apiKey: string,
  payload: BuiltMailPayload,
  baseUrl?: string
): Promise<SendResult> {
  // We post directly to the SendGrid-compatible REST API.
  // For real SendGrid, always use the official host and ignore overrides.
  // For PIT, allow baseUrl/env override.
  const effectiveBase = provider === 'sendgrid'
    ? 'https://api.sendgrid.com'
    : (baseUrl || process.env.SENDGRID_BASE_URL || 'http://localhost:8825');
  const url = `${effectiveBase.replace(/\/$/, "")}/v3/mail/send`;
  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      validateStatus: () => true
    });
    const id = (res.headers["x-message-id"] as any) || (res.headers["x-message-id" as any] as any);
    return { ok: res.status >= 200 && res.status < 300, status: res.status, id: Array.isArray(id) ? id[0] : id };
  } catch (err) {
    return { ok: false, status: 0, details: (err as Error).message };
  }
}
