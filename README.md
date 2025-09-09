<img src="https://pointw.com/img/sendgrid-pit-logo.svg" width="150px">

# sendgrid-pit
> mailpit for sendgrid

**sendgrid-pit** serves as an emulator of Twilio's SendGrid service.

## Quick start

### Get it

Get the image from [docker hub](https://hub.docker.com/r/pointw/sendgrid-pit)

```bash
docker pull pointw/sendgrid-pit
```


### Run it

Use the included **docker-compose.yml** file to spin up sendgrid-pit and mongo, or use this to copy into your own docker-compose.yml file.

Alternately (minimal and ephemeral)
```bash
docker run -d --rm --name sendgrid-pit -p 8825:8825 pointw/sendgrid-pit
```

### Use it

Here is a simple Typescript that connects the emulator instead of the real SendGrid service:


```Typescript
import sendGridClient from '@sendgrid/mail';
import client from '@sendgrid/client';
import { MailDataRequired } from '@sendgrid/mail'


const useEmulator = true;
const apiKey = useEmulator? 'SG.mock-sendgrid' : 'SG.real-api-key'

export async function sendEmail() {
    client.setApiKey(apiKey);
    if (useEmulator) {
      client.setDefaultRequest('baseUrl', 'http://localhost:8825');
    }
    sendGridClient.setClient(client);

    const body = 'Message for you, sir!';

    const message: MailDataRequired = {
        to: 'michael@pointw.com',
        from: 'richard@pointw.com',
        replyTo: 'ottosonm@gmail.com',
        content: [
          {type: 'text/plain', value: body}
        ]
    };

    const [response, _] = await sendGridClient.send(message);
    return response
}
```


## API (http)

### emulator

* Send message: `POST /v3/mail/send` (the sendgrid client uses this endpoint)

### api
> The UI uses these endpoints.  You may find use for them too.

* Retrieve sent messages: `GET /api/messages`

* Delete sent mail(s): `DELETE /api/messages/{messageId}`

* Mark mails as read:
  * single mail: `PATCH /api/messages/{messageId}`  (`read` field only allowed)
  * all mails:  `POST /api/messages/mark-all-read`

* Event stream (SSE): `/events`

### templates

* List templates: `GET /api/templates`
* Create template: `POST /api/templates` (body: `{ title: string, templateId: string, subject?: string, templateBody?: string, testData?: string }`)
* Update template: `PATCH /api/templates/{id}` (any of: `title`, `templateId`, `subject`, `templateBody`, `testData`)
* Delete template: `DELETE /api/templates/{id}`

Templatized subjects
- Templates can define a `subject` string that supports Handlebars (same data as the body).
- When viewing a message that references a saved template (`template_id`) and includes `personalizations[n].dynamic_template_data`, the subject displayed is the rendered template subject; otherwise the message’s `subject` is shown.

## UI

* Browse to http://localhost:8825 (change the port here if you changed the `PORT` environment variable)
* Template editor allows editing Title, Template ID, Subject, Body, and Test Data. Subject appears under the Template ID and accepts Handlebars.

## CLI Sender (sg-sender)

Use the interactive CLI in `scripts/tui` to send messages via real SendGrid or this emulator.

- Build: `cd scripts/tui && npm i && npm run build`
- Run: `node dist/cli.js` (prompts for missing values)
- Quick PIT: `node dist/cli.js --provider pit --base-url http://localhost:8825 --from you@ex.com --to me@ex.com --subject "Hi" --text "Hello"`
- Quick SendGrid: `node dist/cli.js --provider sendgrid --api-key $SENDGRID_API_KEY --from you@ex.com --to me@ex.com --template-id d-...`

Answers and defaults
- Saves non‑secret defaults to `sg-sender.answers.json` (change with `--answers-file path.json`).
- `--defaults` uses saved values without prompting; otherwise prompts but pre‑fills from the answers file.
- For provider `sendgrid`, API key is masked and not saved; for `pit`, API key is optional and saved if provided.

Editing HTML/JSON
- For multi‑line HTML and dynamic template data, the CLI opens your `$VISUAL`/`$EDITOR` (falls back to nano or notepad). Save and close to continue.

See `scripts/tui/README.md` for full CLI options and examples.

## Environment Variables

* PORT - (default `8825`) the port the emulator listens on (both api and ui)
* API_KEY - (optional) if set, causes the emulator to reject as unauthorized any POSTs to the send message endpoint if the sendgrid client was not configured with this API_KEY
* MONGO_URI - (optional) if set, enables MongoDB persistence; otherwise data is stored in memory
* MONGO_DB_NAME (default `sendgrid-pit`) - the MongoDB database name
  - Collections are: `messages` and `templates`


## Roadmap
* improved message list (group by sender | recipient/mailbox | none, sorting, searching, filtering)
* forward from sendgrid-pit to SendGrid (?) - adjusting message id
  * get status of actual delivery using message id


## Acknowledgements:  
* (c) janjaali and Contributors - this project borrows heavily from [sendGrid-mock](https://github.com/janjaali/sendGrid-mock)
* UI inspired by [axllent/mailpit](https://github.com/axllent/mailpit)
