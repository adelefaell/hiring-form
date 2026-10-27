# Hiring Form

Workshop/hiring registration form. React 19 + Vite + TypeScript + Tailwind v4. Submits to a Google Sheet via a Cloudflare Pages Function.

## Setup

Copy `.dev.vars.example` to `.dev.vars` with your Google service-account keys (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEET_ID`, `SHEET_RANGE`) and `TURNSTILE_SECRET`. Set the same four Google vars plus `TURNSTILE_SECRET` as Pages secrets in prod (deploys don't pick up `.dev.vars`).

Frontend env: `VITE_TURNSTILE_SITE_KEY` (in `.env.local` locally). Test keys: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

```bash
pnpm install
pnpm dev                       # vite, proxies /api to :8788
pnpm build && pnpm pages:dev   # local backend with KV + functions
pnpm lint && pnpm build        # verify
```

## Deploy

One-time (per account): `pnpm wrangler kv namespace create SUBMISSIONS`, then bind it in the Pages project (Settings → Functions → KV namespace bindings, variable name `SUBMISSIONS`).

```bash
pnpm build && CLOUDFLARE_ACCOUNT_ID=<id> npx wrangler pages deploy dist --project-name hiring-form
```

## Spam protection

Honeypot, server-verified Cloudflare Turnstile, and an edge rate limit. Duplicates are prevented by a KV-backed uniqueness check on the E.164 phone number, with the key released if the Sheets write fails.

Edge rate limit is dashboard-only: your domain → Security → WAF → Rate limiting rules → URI Path `/api/submit` Method POST, block > 5 req/min per IP.

## Note

KV is eventually consistent: two simultaneous submits with the same phone can both pass. Airtight fix is D1 with a UNIQUE constraint; overkill here. Sheet-side duplicate check on the phone column is a cheap backstop.
