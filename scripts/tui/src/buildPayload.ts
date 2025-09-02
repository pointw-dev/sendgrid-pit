
import type { BuiltMailPayload, CliArgs } from "./types.js";
import { coerceList, htmlToText, textToHtml, readAttachment } from "./util.js";

export function buildPayload(args: CliArgs): BuiltMailPayload {
  if (!args.from) throw new Error("'from' is required");
  const to = coerceList(args.to) ?? [];
  if (to.length === 0) throw new Error("at least one 'to' recipient is required");

  const usingTemplate = Boolean(args.templateId);
  const html = args.html ?? (args.text ? textToHtml(args.text) : undefined);
  const text = args.text ?? (args.html ? htmlToText(args.html) : undefined);

  if (!usingTemplate && !html && !text) {
    // provide very gentle default
    const defaultText = "Hello from sendgrid-cli-tui";
    return base({
      args,
      text,
      html: textToHtml(defaultText),
      subject: args.subject ?? "Test Email",
    });
  }

  if (usingTemplate) {
    return base({
      args,
      subject: args.subject, // used only if template doesn't set subject
      templateId: args.templateId,
      data: args.data ?? {},
    });
  }

  return base({ args, html: html!, text, subject: args.subject ?? "(no subject)" });
}

function base({
  args,
  html,
  text,
  subject,
  templateId,
  data
}: {
  args: CliArgs;
  html?: string;
  text?: string;
  subject?: string;
  templateId?: string;
  data?: Record<string, unknown>;
}): BuiltMailPayload {
  const to = (args.to ?? []).map(email => ({ email }));
  const cc = (args.cc ?? []).map(email => ({ email }));
  const bcc = (args.bcc ?? []).map(email => ({ email }));

  const attachments = (args.attachments ?? []).map(readAttachment);

  const payload: BuiltMailPayload = {
    personalizations: [
      {
        to,
        ...(cc.length ? { cc } : {}),
        ...(bcc.length ? { bcc } : {}),
        ...(data ? { dynamic_template_data: data } : {}),
        ...(subject ? { subject } : {}),
      },
    ],
    from: { email: args.from! },
    ...(args.replyTo ? { reply_to: { email: args.replyTo } } : {}),
    ...(attachments.length ? { attachments } : {}),
  };

  if (templateId) {
    payload.template_id = templateId;
  } else {
    const content = [] as BuiltMailPayload["content"];
    if (text) content!.push({ type: "text/plain", value: text });
    if (html) content!.push({ type: "text/html", value: html });
    if (content && content.length) payload.content = content;
    if (subject) payload.subject = subject;
  }

  return payload;
}
