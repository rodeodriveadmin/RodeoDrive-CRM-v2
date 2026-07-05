# Rodeo Drive CRM v2

Workshop management CRM — full rebuild of the original AWS Amplify app on a **portable, AWS-free stack**. Runs anywhere Node.js and PostgreSQL run.

## Stack

| Concern | v1 (AWS) | v2 (this repo) |
|---|---|---|
| Framework | React + Vite SPA | **Next.js 15** (App Router, TypeScript) |
| Auth | Cognito + groups | **Better Auth** (sessions in our own DB) |
| Database | DynamoDB + AppSync | **PostgreSQL + Drizzle ORM** (dev: embedded PGlite) |
| Server logic | 16 Lambdas | Next.js **server actions** with RBAC guards |
| File storage | S3 | S3-compatible (Cloudflare R2 / MinIO) — later phase |
| Email | SES | Resend / SMTP — later phase |
| SMS | SNS + SQS | Provider interface (stubbed) — later phase |
| Cron | EventBridge | In-app scheduler (pg-boss) — later phase |
| Hosting | Amplify | **Railway / any Docker host / VPS** |
| Mobile | — | Installable **PWA** |
| Languages | EN / AR | EN / AR with full RTL |

## Architecture: module clusters

Every feature is a **self-contained cluster** under `src/modules/<name>/` holding its own
pages, views, server actions, translations (`i18n.ts`) and stylesheet (`<name>.css`).
Upgrading one module never touches another:

```
src/
  modules/
    shell/        app frame: sidebar, topbar, nav (shell.css, i18n.ts)
    auth/         login (login.css, i18n.ts)
    dashboard/    page.tsx + view.tsx + dashboard.css + i18n.ts
    users/        actions.ts + page.tsx + view.tsx + users.css + i18n.ts
    departments/  …
    roles/        policy matrix editor
    activity/     audit trail
  components/ui.tsx      shared UI primitives (buttons, cards, tables, modals)
  styles/                base.css + components.css (primitives cluster)
  lib/                   shared core: auth, rbac, i18n merger, activity log, compliance
  db/                    drizzle schema + seed
  app/                   thin Next.js routes that re-export module pages
```

The Next.js route files contain **no logic** — they re-export the module's page, so the
`app/` tree is just the URL map.

## Theming: one CSS file per organization

All colors, radii, shadows, the **logo** and the **login background photo** are CSS
variables defined in `public/themes/default.css`. To re-brand for a new organization:

1. Copy `public/themes/default.css` → `public/themes/<org>.css`
2. Change the variables (`--color-accent`, `--org-logo: url(...)`, `--org-login-bg: url(...)`, …)
   and drop the org's images into `public/themes/assets/`
3. Set `NEXT_PUBLIC_ORG_THEME=<org>` in the environment

No component code changes — every component reads only theme variables.
See `public/themes/example-org.css` for a working example.

## PCI DSS

Cardholder data never touches this system — see [docs/COMPLIANCE.md](docs/COMPLIANCE.md)
for the enforced rules (no-card-data guard, security headers, server-side RBAC,
audit trail, session hygiene) and the deployment checklist.

## Development

```bash
npm install
npm run db:push    # create tables (embedded PGlite in ./.pglite — no DB install needed)
npm run db:seed    # Administrator role + Management department + root admin from .env.local
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` first and set `ROOT_ADMIN_EMAIL` / `ROOT_ADMIN_PASSWORD`.

## Production

Set these env vars (e.g. on Railway):

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — long random string (`openssl rand -base64 32`)
- `BETTER_AUTH_URL` — public app URL
- `ROOT_ADMIN_EMAIL`, `ROOT_ADMIN_PASSWORD`, `ROOT_ADMIN_NAME` — first admin account
- `NEXT_PUBLIC_ORG_THEME` — organization theme file name (default: `default`)

Then:

```bash
npm run db:push && npm run db:seed && npm run build && npm start
```

## Roadmap

1. ✅ Phase 1 — auth, RBAC, users, departments, roles, activity log, app shell, theming, PWA
2. Customers, vehicles, service catalog (categories, brand specs, per-vehicle-type pricing)
3. Job orders (lifecycle, service items, roadmap, documents), payments, invoices, quotations, vouchers
4. Inspections, quality check, service execution, exit permits
5. Inventory, dashboard analytics, daily/scheduled reports
6. Drive (files), internal chat, campaigns, SMS provider, tickets, deals
