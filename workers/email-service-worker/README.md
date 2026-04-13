# Email Service Worker

This Worker receives inbound email and sends outbound email using Cloudflare Email Routing `send_email` bindings with `EmailMessage` + raw RFC822 MIME content.

## Files

- `wrangler.jsonc`: Worker config and `send_email` binding.
- `src/index.ts`: `email()` handler with forward + doc-aligned send example.

## 1) Configure binding

Update `wrangler.jsonc` with your verified destination address:

```jsonc
{
  "send_email": [
    {
      "name": "SEND_EMAIL",
      "destination_address": "your-verified-destination@example.com"
    }
  ]
}
```

## 2) Configure handler addresses

Update this in `src/index.ts`:

- `message.forward("destination@example.com")`

The outbound message destination follows `DESTINATION_EMAIL` and the binding destination in `wrangler.jsonc`.

Current configured destination in this project: `preploop.me@gmail.com`.

## 2.1) Sending pattern used

This project uses the official Cloudflare pattern:

- Build raw RFC822 email content in code
- Create `new EmailMessage(from, to, rawMime)`
- Send via `await env.SEND_EMAIL.send(emailMessage)`

It also includes lightweight safety checks:

- Reject very large inbound emails.
- Reject potential self-loop emails.
- Ignore auto-generated/bulk/list-style emails by header signals.
- Strip CR/LF from header values before constructing MIME headers.

## 3) Prerequisites

- Email Routing enabled for your Cloudflare domain.
- Destination mailbox verified in Email Routing.
- Sender (`from`) is from your routed domain (or allowed by binding policy).

## 4) Run

```bash
npm install
npm run dev
```

## 5) Deploy

```bash
npm run deploy
```

For config-only validation without deploy:

```bash
npx wrangler deploy --dry-run
```
