import sendGridClient from '@sendgrid/mail';
import client from '@sendgrid/client';
import { MailDataRequired } from '@sendgrid/mail'


const body = 'Message for you, sir!  It is a missive from the tallest tower at Swamp Castle.  It appears to be from a princess, but the writing style is ambiguous.  Clearly it is a call for assistance.';

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>This is only a test</title>
    <style>
      /* simple, inline-safe CSS */
      .btn { display:inline-block; padding:12px 18px; text-decoration:none; border-radius:6px; }
    </style>
  </head>
  <body style="margin:0; padding:24px; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; line-height:1.5; color:#222;">
    <h1 style="margin:0 0 12px;">Message for you, sir! 💌</h1>
    <p style="margin:0 0 16px;">
      This is a <strong>rich HTML</strong> test email sent via SendGrid.
    </p>
    <p style="margin:0 0 24px;">
      If your client can’t render HTML, you’ll see the plain-text version instead.
    </p>
    <a class="btn" href="https://example.com" style="background:#2563eb; color:#fff;">View Details</a>
    <hr style="margin:24px 0; border:none; border-top:1px solid #eee;"/>
    <small style="color:#666;">You’re getting this because someone pushed the big red button.</small>
  </body>
</html>`;


const contents = {
  text: {
    subject: 'Text only',
    content: [
      {type: 'text/plain', value: body}
    ]
  },
  html: {
    subject: 'Multi-part, text and html',
    text: body,     // <-- text fallback
    html,           // <-- rich HTML content
  },
  template: {
    templateId: 'd-4a2104934f7e439a9e8e0d4c8a0f9c9a',
    dynamicTemplateData: {
      username: 'biscuit314',
      point1: 'high quality',
      point2: 'reasonably priced'
    }
  }
}



async function sendEmail(url, content) {
    const password = 'SG.mock-sendgrid';
    client.setApiKey(password);
    client.setDefaultRequest('baseUrl', url);
    sendGridClient.setClient(client);

    const message: MailDataRequired = {
        // to: ['michael@pointw.com', 'to2@pointw.com'],
        // cc: ['cc1@pointw.com', 'cc2@pointw.com'],
        // bcc: ['bcc1@pointw.com', 'bcc2@pointw.com'],
        to: 'notification-scheduler@trinnex.io, someone-else@pernod-ricard.ca',
        from: 'richard@pointw.com',
        replyTo: 'ottosonm@gmail.com',
        ...content
    };

    console.log(JSON.stringify(sendGridClient, null, 2))
    const [response, _] = await sendGridClient.send(message);
    return response
}


(async () => {
    if (process.argv.length != 4) {
        console.log('USAGE: sender.ts text|html|template port')
        process.exit(1)
    }

    const which = process.argv[2]
    const port = process.argv[3]
    const url = `http://localhost:${port}`

    const content = contents[which];

    if (!content) {
      console.log(`invalid email type: ${which}`)
      process.exit(2)
    }

    const response = await sendEmail(url, content);
    console.log(`Message ID: ${response.headers['x-message-id']}`);
    console.log()
    console.log(JSON.stringify(response, null, 2))
})();

