export interface MailMessage {
  id: string;
  receivedAt: string; // ISO
  // capture whatever is POSTed; SendGrid-style payloads vary
  payload: unknown;
  read: boolean;
}
