
# sendgrid-cli-tui

A single binary that lets you send emails via **real SendGrid** or a **SendGrid‑compatible PIT** service. It accepts command‑line options, and for any missing values it launches an interactive **TUI** (prompts) to collect the rest. Sensible defaults ensure a smooth flow:

- Choose provider: `sendgrid` or `pit`.
- Choose content style: **dynamic template** *or* **subject + body (text/html)**.
- If only `text` is provided, HTML is auto‑generated. If only `html` is provided, a plain‑text version is derived.
- All inputs provided on the command line are respected and **not** prompted again.

## Quickstart

```bash
npm i
npm run build
# invoke
node dist/cli.js --provider pit --api-key P1T_TOKEN --base-url http://localhost:3000   --from you@example.com --to them@example.com --subject "Hello" --text "Hi there"

# or launch TUI for anything you omit
node dist/cli.js --provider sendgrid --api-key $SENDGRID_API_KEY
```

## Environment variables

- `SENDGRID_API_KEY` – default for `--api-key`
- `SENDGRID_BASE_URL` – default for `--base-url` (set to PIT base URL to target PIT)
- `FROM_EMAIL` – default for `--from`
- `SEND_PROVIDER` – default for `--provider`

## Examples

**Use a dynamic template**
```bash
node dist/cli.js   --provider sendgrid --api-key $SENDGRID_API_KEY   --from no-reply@acme.io --to user@acme.io   --template-id d-1234567890abcdef1234567890abcdef   --data '{"firstName":"Ada"}'
```

**Send basic body (auto-derive text or HTML)**
```bash
node dist/cli.js   --from me@acme.io --to you@acme.io   --subject "Hi" --text "Hello there"
```

**Dry run** (inspect payload only)
```bash
node dist/cli.js --from me@acme.io --to you@acme.io --subject Hi --text Hello --dry-run
```

## Notes

- We post directly to the SendGrid REST API (`/v3/mail/send`) using Axios. For PIT, set `--base-url` (or `SENDGRID_BASE_URL`) to your PIT origin; headers and payload remain SendGrid‑compatible.
- Attachments supported via file paths (comma-separated).
- The tool allows `subject` even in template mode; SendGrid will ignore it if the template defines its own subject.
