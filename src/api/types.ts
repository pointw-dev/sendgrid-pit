export interface MailMessage {
  id: string;
  receivedAt: string; // ISO
  // capture whatever is POSTed; SendGrid-style payloads vary
  payload: unknown;
  read: boolean;
}

export interface TemplateItem {
  id: string; // internal id
  title: string;
  templateId: string; // external SendGrid template id
  templateBody: string; // editable body content (future)
  createdAt: string; // ISO
}
