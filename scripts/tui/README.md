
# sg-sender

Send emails via either the real **SendGrid** API or an emulator like **sendgrid‑pit. The CLI accepts flags, prompts for anything missing, and persists your answers as defaults for future runs.

## Quickstart

```bash
npm i
npm run build

# PIT (emulator)
node dist/cli.js --provider pit --base-url http://localhost:8825 \
  --from you@example.com --to them@example.com --subject "Hello" --text "Hi there"

# Real SendGrid
node dist/cli.js --provider sendgrid --api-key $SENDGRID_API_KEY \
  --from no-reply@acme.io --to user@acme.io --template-id d-123... --data '{"first":"Ada"}'
```

## Options & defaults

- `--provider`: `sendgrid` (real) or `pit` (emulator). Asked first.
- `--answers-file`: path to defaults file (JSON). Default: `sg-sender.answers.json`. Env: `SG_SENDER_ANSWERS`.
- `--defaults`: use saved values without prompting; otherwise prompts with saved values pre‑filled.
- `--from`, `--to`, `--cc`, `--bcc`, `--subject`, `--reply-to`, `--attachments` (file paths).
- `--template-id` + `--data` (JSON) for Dynamic Templates, or `--text`/`--html` for body mode.
- `--dry-run`: print payload only.

Environment variables
- `SENDGRID_API_KEY`: default API key. For real SendGrid, shown as “using SENDGRID_API_KEY” and masked; not saved. For PIT, shown plainly and saved if provided.
- `SENDGRID_BASE_URL`: base URL for PIT (ignored for real SendGrid).
- `FROM_EMAIL`, `SEND_PROVIDER`: additional defaults.

## Examples

Provider‑specific behavior
- Real SendGrid: always posts to `https://api.sendgrid.com` (Base URL ignored). API key required, masked at prompt, never saved.
- PIT: posts to `--base-url` (or `SENDGRID_BASE_URL`). API key optional; saved to answers if provided.

Examples
**Dynamic template**
```bash
node dist/cli.js   --provider sendgrid --api-key $SENDGRID_API_KEY   --from no-reply@acme.io --to user@acme.io   --template-id d-1234567890abcdef1234567890abcdef   --data '{"firstName":"Ada"}'
```

**Body mode (auto-derive text or HTML)**

```bash
node dist/cli.js   --from me@acme.io --to you@acme.io   --subject "Hi" --text "Hello there"
```

**Dry run** (inspect payload only)

```bash
node dist/cli.js --from me@acme.io --to you@acme.io --subject Hi --text Hello --dry-run
```

## Editing HTML and JSON

For multi‑line fields (`--html` and template `--data`), the CLI opens your editor:
- Uses `$VISUAL` or `$EDITOR`; falls back to `nano` (Linux/macOS) or `notepad` (Windows).
- A short message appears first: press Enter to launch the editor; save and close to continue.

Notes
- Payloads are SendGrid‑compatible (`/v3/mail/send`).
- Attachments are supported via file paths (comma‑separated or repeated).
- In Dynamic Template mode, the CLI does not prompt for `subject`. If you provide `--subject`, it is sent and used only when the template does not define its own subject.
