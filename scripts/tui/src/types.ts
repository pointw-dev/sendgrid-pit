
export type Provider = "sendgrid" | "pit";

export interface CliArgs {
  provider?: Provider;
  apiKey?: string;
  baseUrl?: string; // override for PIT (e.g. http://localhost:3000)
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  replyTo?: string;
  templateId?: string;
  data?: Record<string, unknown>; // dynamicTemplateData
  text?: string;
  html?: string;
  attachments?: string[]; // file paths
  dryRun?: boolean;
}

export interface BuiltMailPayload {
  personalizations: Array<{
    to: Array<{ email: string }>;
    cc?: Array<{ email: string }>;
    bcc?: Array<{ email: string }>;
    dynamic_template_data?: Record<string, unknown>;
    subject?: string; // subject ignored when using dynamic template subject, otherwise used
  }>;
  from: { email: string };
  reply_to?: { email: string };
  subject?: string; // for non-template
  content?: Array<{ type: "text/plain" | "text/html"; value: string }>;
  template_id?: string;
  attachments?: Array<{ content: string; filename: string; type?: string; disposition?: string }>;
}
