<img src="https://www.pointw.com/img/sendgrid-pit-logo.svg" width="150px">

# sendgrid-pit
> mailpit for sendgrid

**sendgrid-pit** serves as an emulator of Twilio's SendGrid service.

## Quick start


### Run the emulator

Use the included docker-compose.yml file to spin up sendgrid-pit and mongo, or use this to copy into your own docker-compose.yml file.

Alternately (minimal and ephemeral)
```bash
docker run -d --rm --name sendgrid-pit -p 8825:8825 pointw/sendgrid-pit
```

## Use the emulator
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

## UI

* Browse to http://localhost:8825 (change the port here if you changed the `PORT` environment variable)

## Environment Variables

* PORT - (default `8825`) the port the emulator listens on (both api and ui)
* API_KEY - (optional) if set, causes the emulator to reject as unauthorized any POSTs to the send message endpoint if the sendgrid client was not configured with this API_KEY
* MONGO_URI - (optional) if set, causes messages POSTed to the emulator to be saved in mongo - otherwise it is just stored in memory
* MONGO_DB_NAME (default `sendgrid-pit`) - the name of the mongodb
* MONGO_COLLECTION_NAME (default `messages`) the collection messages are saved to


## Roadmap
* render templates in viewer
* improved message list (group by sender | recipient/mailbox | none, sorting, searching, filtering)
* forward from sendgrid-pit to SendGrid (?) - adjusting message id
  * get status of actual delivery using message id


## Acknowledgements:  
* (c) janjaali and Contributors - this project borrows heavily from [sendGrid-mock](https://github.com/janjaali/sendGrid-mock)
* UI inspired by [axllent/mailpit](https://github.com/axllent/mailpit)
