import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import addFormats from 'ajv-formats';
import { Validator, ValidationError } from 'express-json-validator-middleware';
import { v3MailSend } from './message.schema';
import { addClient, addMessage, getMessages, deleteMessage, setRead, clearMessages, markAllRead } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'development' ? '../ui' : '../src/ui'
);
const validator = new Validator({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
//  removeAdditional: 'all',
});
addFormats(validator.ajv);
const { validate } = validator;
const app = express();
const PORT = process.env.PORT ?? 3000;
const API_KEY = process.env.API_KEY ?? 'unset';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API
app.post(
  '/v3/mail/send',
  validate({ body: v3MailSend }),
  async (req, res) => {

    const reqApiKey = req.headers.authorization;

    if (!(API_KEY == 'unset' || reqApiKey === `Bearer ${API_KEY}`)) {
      res.status(403).send({
        errors: [{
          message: 'Failed authentication',
          field: 'authorization',
          help: 'check used api-key for authentication',
        }],
        id: 'forbidden',
      });
    } else {
      const msg = {
        id: randomUUID(),
        receivedAt: new Date().toISOString(),
        payload: req.body ?? {},
        read: false
      };
      await addMessage(msg);
      res.status(202).header({
        'X-Message-ID': msg.id,
      }).send();
    }
  }
);

app.get('/api/messages', async (_req, res) => res.json(await getMessages()));

app.delete('/api/messages/:id', async (req, res) => {
  await deleteMessage(req.params.id);
  res.status(204).end();
});

app.delete('/api/messages', async (_req, res) => {
  await clearMessages();
  res.status(204).end();
});

app.patch('/api/messages/:id', async (req, res) => {
  const { read } = req.body ?? {};
  if (typeof read !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  await setRead(req.params.id, read);
  res.status(204).end();
});

app.post('/api/messages/mark-all-read', async (_req, res) => {
  await markAllRead();
  res.status(204).end();
});

app.get('/events', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(`: connected ${Date.now()}\n\n`);
  addClient(res);
});

// Centralized error handler to format validation errors
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: err.validationErrors, // Ajv-style errors (per body/query/params)
    });
  }
  return next(err);
});


// Boot with Vite middleware in dev, static files in prod
async function start() {
  if (process.env.NODE_ENV === 'development') {
    const { createServer } = await import('vite');

    const vite = await createServer({
      configFile: path.resolve(uiDir, 'vite.config.ts'),
      root: uiDir,
      server: { middlewareMode: true },
    });

    app.use(vite.middlewares);
  } else {
    // Serve built UI
    const uiDist = path.resolve(uiDir, 'dist');
    app.use(express.static(uiDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(uiDist, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`API+UI ready on http://localhost:${PORT}`);
  });
}

start();
