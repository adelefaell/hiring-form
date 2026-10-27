# AGENTS.md

Hiring application form app. React 19 + Vite + TypeScript + Tailwind v4.

## Commands

- Install: `pnpm install` (pnpm, not npm/yarn)
- Dev server: `pnpm dev`
- Verify a change: `pnpm lint && pnpm build` — `build` runs `tsc -b` (there is no separate typecheck script) then `vite build`. Lint is `oxlint`, not eslint.
- Preview build: `pnpm preview`
- Local backend: `pnpm build && pnpm wrangler pages dev dist` (serves site + `functions/` on :8788; `vite.config.ts` proxies `/api` there in dev)

## Backend (Cloudflare Pages Function)

- `functions/api/submit.ts` validates with the shared `src/shared/schema.ts`, authenticates to Google (JWT), appends a row to Sheets. No Google/React imports in `src/shared/*` — the Function imports them.
- Local secrets live in `.dev.vars` (gitignored); same four vars (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEET_ID`, `SHEET_RANGE`) must be set as Pages secrets in prod — deploys don't pick up `.dev.vars`.
- `SHEET_RANGE` must be anchored (`Sheet1!A1:F1`, not `Sheet1!A:F`) or the append API misaligns columns when a formula column follows the data.
- Deploy: `pnpm build && CLOUDFLARE_ACCOUNT_ID=<id> npx wrangler pages deploy dist --project-name hiring-form`

## Conventions

- Tailwind v4 is CSS-first: configured in `src/index.css` via `@import "tailwindcss"`. No `tailwind.config.*`, no PostCSS config. Add theme tokens in CSS, not config files.
- React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.ts`). Follow the rules of hooks strictly; oxlint enforces them. Do not call `reset()` from react-hook-form — React Compiler memoizes stale `register` handlers after it; clear fields with `setValue`/`clearErrors` instead.
- Form stack is pre-chosen and installed: `react-hook-form` + `zod` validation + `zustand` state + `react-phone-number-input`. Reuse these — do not add form/validation/state dependencies.
- App lives in `src/App.tsx` (currently a placeholder). `src/main.tsx` is the entrypoint.

## Git

- Commit and push without any AI signature, trailer, or marker of any kind in the commit message (no "Generated with", no Co-Authored-By, no model names).