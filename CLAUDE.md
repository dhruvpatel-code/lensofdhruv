# CLAUDE.md — lensofdhruv.com

This is the master spec for the **Lens of Dhruv** photography platform. Claude Code should treat this as the source of truth for architectural decisions, naming, conventions, and project structure. Update this file as decisions evolve.

---

## 1. Project Overview

A Next.js platform serving as portfolio site + client portal + booking/payment/contract/gallery delivery system for a Tampa, FL real estate, STR, and lifestyle photography business.

**Public site:** portfolio, services, pricing, blog, contact.
**Client portal:** magic-link login, sign contracts, view bookings, pay invoices, download delivered galleries.
**Admin dashboard:** manage bookings, contracts, payments (online + cash), gallery uploads, leads, content.

**Cost philosophy:** Build everything in-house using free tiers and self-hosted patterns. No SaaS dependencies that charge a monthly fee unless absolutely required (Stripe is the one exception — pay per transaction, not subscription).

---

## 2. Tech Stack

| Layer              | Choice                                                | Why                                                            |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------- |
| Framework          | Next.js 15 (App Router) + TypeScript                  | SSR/SSG, Server Actions, edge runtime, great DX                |
| Styling            | Tailwind CSS v4 + shadcn/ui                           | Free, ownable components copied into repo                      |
| Hosting            | Vercel (Hobby tier)                                   | Free, native Next.js, preview deployments, Edge Functions      |
| Database           | Neon Postgres (Free tier)                             | Serverless, branchable per-env, generous free tier (0.5GB)     |
| ORM                | Drizzle ORM                                           | Lightweight, SQL-first, edge-compatible, strong typing         |
| Auth               | Auth.js v5 (NextAuth)                                 | Magic-link email auth, no passwords, free                      |
| Email              | Resend (Free tier — 3k/mo)                            | Magic links, transactional. Fallback: Nodemailer + SMTP        |
| Payments           | Stripe                                                | Cards, Apple/Google Pay, ACH. Webhook-driven                   |
| File Storage       | Cloudflare R2                                         | $0.015/GB, zero egress fees, 10GB free                         |
| Image Optimization | `next/image` + R2 (custom loader)                     | No Cloudinary. AVIF/WebP via Next built-in                     |
| PDFs (contracts)   | `@react-pdf/renderer`                                 | Generate signed contracts in-house                             |
| E-signatures       | Custom (`react-signature-canvas`)                     | Build signature capture; store image + audit trail in Postgres |
| Analytics          | Vercel Analytics (free) + Umami self-hosted on Vercel | No cookie banner needed                                        |
| Error Monitoring   | Sentry (free tier — 5k events/mo)                     | Errors, performance, replay                                    |
| Testing            | Vitest + Playwright + Testing Library                 | See §7                                                         |

---

## 3. Environment Strategy

Three environments, strictly isolated. Never let dev data touch production. Never run untested code against prod DB.

### 3.1 Environments

| Env          | Where                                | Database (Neon branch)  | Stripe    | R2 Bucket  |
| ------------ | ------------------------------------ | ----------------------- | --------- | ---------- |
| `local`      | Developer machine                    | `dev` branch (or local) | test mode | `lod-dev`  |
| `preview`    | Vercel preview deploys (PR branches) | `preview` branch        | test mode | `lod-dev`  |
| `production` | Vercel production (main branch)      | `main` branch           | live mode | `lod-prod` |

### 3.2 Env Variables

Use `.env.local` for local, Vercel Environment Variables UI for `preview` and `production`. Never commit secrets. Validate at boot with `zod`:

```ts
// src/env.ts
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_ENV: z.enum(["local", "preview", "production"]),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  SENTRY_DSN: z.string().optional(),
});
export const env = schema.parse(process.env);
```

Fail fast on boot if any are missing.

### 3.3 Neon Branching

- `main` branch = production DB
- `preview` branch = shared preview/staging DB, reset weekly via cron
- `dev` branch = personal dev DB, can be reset anytime
- Use Neon's Vercel integration to auto-branch DBs per PR (optional, paid on bigger plans — skip for now, use shared `preview` branch)

### 3.4 Stripe Webhooks Locally

Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Store webhook secret in `.env.local`.

---

## 4. Folder Structure

```
/
├── .github/workflows/           # CI: lint, typecheck, test, e2e
├── docs/                        # ADRs, runbooks, architecture diagrams
├── drizzle/                     # Migrations (generated)
├── public/
├── src/
│   ├── app/
│   │   ├── (marketing)/         # Public: /, /work, /services, /about, /contact, /blog
│   │   ├── (auth)/              # /signin, /verify
│   │   ├── portal/              # Client portal (authed, role=client)
│   │   │   ├── bookings/[id]/
│   │   │   ├── galleries/[id]/
│   │   │   ├── invoices/
│   │   │   └── documents/
│   │   ├── admin/               # Admin dashboard (authed, role=admin)
│   │   │   ├── bookings/
│   │   │   ├── clients/
│   │   │   ├── galleries/
│   │   │   ├── contracts/
│   │   │   └── reports/
│   │   └── api/
│   │       ├── webhooks/stripe/
│   │       └── trpc/            # if we add tRPC; otherwise Server Actions
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── marketing/
│   │   ├── portal/
│   │   ├── admin/
│   │   └── shared/
│   ├── lib/
│   │   ├── auth/                # Auth.js config
│   │   ├── db/                  # Drizzle client + schema
│   │   ├── stripe/              # Stripe client + helpers
│   │   ├── storage/             # R2 client + signed URL helpers
│   │   ├── email/               # Resend templates
│   │   ├── pdf/                 # Contract PDF generation
│   │   └── utils/
│   ├── server/
│   │   ├── actions/             # Server Actions (mutations)
│   │   ├── queries/             # Server-side data fetchers
│   │   └── services/            # Domain logic (booking, payment, gallery)
│   ├── types/
│   └── env.ts
├── tests/
│   ├── unit/                    # Vitest
│   ├── integration/             # Vitest + test DB
│   └── e2e/                     # Playwright
├── drizzle.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── next.config.ts
└── CLAUDE.md
```

**Architectural rule:** Components never talk to the DB. They call **Server Actions** (mutations) or import from `server/queries/*` (reads). Domain logic lives in `server/services/*` and is unit-testable without spinning up Next.js.

---

## 5. Data Model (Drizzle Schema Sketch)

Single Postgres DB. Use UUIDs (v7 for sortability) as PKs. All tables have `created_at`, `updated_at`.

```
users           id, email, name, phone, role (client|admin), created_at
sessions        (Auth.js)
verification_tokens (Auth.js)

packages        id, name, slug, price_cents, description, features (jsonb), active
addons          id, name, price_cents, description, active

bookings        id, client_id → users, package_id → packages,
                shoot_date (timestamptz), address, sqft,
                subtotal_cents, addon_total_cents, total_cents,
                paid_online_cents, paid_cash_cents, balance_cents (generated),
                status (pending|confirmed|completed|cancelled|refunded),
                notes, created_at, updated_at

booking_addons  booking_id, addon_id, price_cents

contracts       id, booking_id, template_version, html_snapshot (text),
                pdf_url (R2 key), status (pending|signed|voided),
                signature_image_url, signature_typed_name,
                signed_at, signed_ip, signed_user_agent

payments        id, booking_id, amount_cents, method (stripe|cash|other),
                stripe_payment_intent_id, stripe_charge_id,
                received_at, recorded_by → users (admin who logged cash)

galleries       id, booking_id, title, cover_photo_id,
                state (draft|preview|delivered|archived),
                expires_at, download_pin (nullable), created_at

photos          id, gallery_id, r2_key, filename, width, height,
                blurhash, file_size, sort_order, is_cover

favorites       gallery_id, photo_id, client_id (composite PK)

leads           id, name, email, phone, message, source, status, created_at

audit_logs      id, actor_id → users, entity_type, entity_id,
                action, diff (jsonb), ip, ua, created_at
```

**Rules:**

- Money in `*_cents` (BIGINT). Never use floats.
- `balance_cents` is `total_cents - paid_online_cents - paid_cash_cents`, computed via a Postgres generated column.
- Every state-changing admin action writes to `audit_logs`.
- Soft-delete only for `bookings` and `galleries` (add `deleted_at`); hard-delete fine elsewhere.

---

## 6. Core Flows

### 6.1 Booking + Payment

1. Client picks package + date → fills shoot details → submits
2. Server creates `booking` (status=pending), `contract` (status=pending), Stripe `PaymentIntent` for deposit or full
3. Client redirected to Stripe Checkout (Embedded) or hosted page
4. Client signs contract (in-portal, captures signature, IP, UA, timestamp)
5. Webhook `payment_intent.succeeded` → mark `payment` recorded, update booking status → `confirmed`
6. Resend sends confirmation + ICS calendar invite
7. Cash payments: admin records via `/admin/bookings/[id]/payments/new` → audit logged

### 6.2 Contract

- Generate from template + booking data → store HTML snapshot in DB (immutable record)
- Render to PDF via `@react-pdf/renderer` after signature → upload to R2 → store key on contract row
- Audit fields: IP, UA, timestamp, typed name, signature image dataURL stored separately in R2

### 6.3 Gallery Delivery

1. Admin uploads photos to draft gallery (multipart → R2, blurhash computed server-side)
2. Photos saved with sort order, dimensions, blurhash
3. Admin sets cover, marks state → `delivered`, sets `expires_at` (default +90 days)
4. Resend sends "Your photos are ready" with hero preview to client
5. Client logs in via magic link → views gallery → favorites/downloads
6. Downloads stream signed R2 URLs (1-hour expiry). Zip generated on-demand via streaming response

### 6.4 Auth

- Magic-link only. No passwords.
- Sessions: database strategy (Auth.js), 30-day rolling
- Role on `users` row drives middleware: `/admin/*` requires `role=admin`, `/portal/*` requires authenticated
- Add gallery PIN as optional 2FA on high-value galleries

---

## 7. Testing Strategy

**Non-negotiable.** Every PR runs full suite in CI. Coverage threshold 80% for `server/services/*` (the business logic).

### 7.1 Layers

| Layer             | Tool                           | Scope                                              |
| ----------------- | ------------------------------ | -------------------------------------------------- |
| Unit              | Vitest                         | Pure functions, services, utils, schema validators |
| Component         | Vitest + React Testing Library | UI components in isolation                         |
| Integration       | Vitest + test Postgres         | Server Actions, queries, services with real DB     |
| E2E               | Playwright                     | Critical user flows end-to-end                     |
| Visual regression | Playwright screenshots         | Marketing pages, gallery, portal                   |
| Type safety       | `tsc --noEmit`                 | Runs in CI; zero errors                            |
| Lint              | ESLint + Prettier              | Runs in CI                                         |

### 7.2 Test Database

- Spin up ephemeral Neon branch per CI run, OR
- Use Docker Postgres locally + GitHub Actions service container
- Migrations run before suite, DB truncated between tests (not dropped/recreated)
- Seed factories in `tests/factories/*` — no shared fixtures

### 7.3 Critical E2E Flows (must always pass before deploy)

1. **Booking happy path:** visitor → picks package → fills form → pays deposit → signs contract → sees confirmation
2. **Cash booking:** admin creates booking → marks cash received → balance updates → client sees zero balance
3. **Gallery delivery:** admin uploads photos → publishes gallery → client logs in via magic link → downloads zip
4. **Stripe webhook:** simulated webhook → booking status flips → email sent
5. **Auth & RBAC:** client cannot access `/admin/*`; logged-out user cannot access `/portal/*`
6. **Refund flow:** admin issues partial refund → balance correct → audit log written

### 7.4 Stripe Testing

- Use Stripe test cards (`4242 4242 4242 4242` success, `4000 0000 0000 0002` decline)
- Mock the Stripe SDK in unit tests; hit real Stripe test mode in integration tests
- Webhook tests use Stripe CLI fixtures via `stripe trigger`

### 7.5 Pre-Commit

Husky + lint-staged: format + lint + typecheck on staged files. Full test on `pre-push`.

### 7.6 CI Pipeline (`.github/workflows/ci.yml`)

```
on: [pull_request, push to main]
jobs:
  - lint            (eslint + prettier check)
  - typecheck       (tsc --noEmit)
  - unit            (vitest run, exclude integration)
  - integration     (vitest, with Postgres service)
  - e2e             (playwright, against built Next.js)
  - build           (next build — catches SSR issues)
```

Block merge if any job fails.

---

## 8. Security & Compliance

- All forms validated server-side with `zod` (never trust client)
- Rate limit auth, contact, booking endpoints (Upstash Redis free tier or in-memory for now)
- CSRF: Next.js Server Actions have built-in protection; verify origin on webhooks
- Stripe webhooks: verify signature on every request, reject if invalid
- Magic links: single-use, 10-min expiry
- R2 signed URLs: 1-hour max, scoped to single object
- PII: store only what's needed. Hash IPs in `audit_logs` after 90 days
- HTTPS only; HSTS header; secure cookies in prod
- Content Security Policy in `next.config.ts`
- No PII in logs or Sentry breadcrumbs — scrub before send

---

## 9. Conventions

- **Naming:** kebab-case files, PascalCase components, camelCase functions/vars, SCREAMING_SNAKE for env vars
- **Imports:** absolute via `@/` alias (Next.js default)
- **Server vs Client:** default to Server Components. Add `"use client"` only when needed (interactivity, hooks)
- **Mutations:** Server Actions only. No POST API routes except webhooks
- **Forms:** `react-hook-form` + `zod` resolver; same schema reused server-side
- **Errors:** never throw raw — return discriminated union `{ ok: true, data } | { ok: false, error }` from services
- **Logging:** `pino` with structured JSON in prod, pretty in dev. Pipe to Vercel logs
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Branches:** `main` (prod), `dev` (optional integration), `feat/*`, `fix/*`

---

## 10. Build Roadmap

Build in vertical slices — each phase shippable, tested, deployed to production behind a feature flag if not user-ready.

| Phase | Scope                                                            | Done when                                                           |
| ----- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| 0     | Scaffold: Next.js, Tailwind, shadcn, Drizzle, Auth, env, CI      | Empty app deploys to Vercel; CI green; `/health` route returns 200  |
| 1     | Public marketing site: home, portfolio, services, about, contact | All pages live; portfolio renders from DB; Lighthouse perf ≥ 90     |
| 2     | Auth + portal shell + admin shell                                | Magic link login works; role-based routing; empty dashboards render |
| 3     | Bookings + Stripe + cash flow                                    | Full booking lifecycle works end-to-end in test mode; E2E green     |
| 4     | Contracts (generation + signing + PDF)                           | Client can sign in portal; PDF stored in R2; audit trail correct    |
| 5     | Gallery upload + delivery + downloads                            | Admin uploads, client downloads zip; gallery state machine enforced |
| 6     | Notifications (email everywhere)                                 | All state transitions trigger correct email                         |
| 7     | Blog + SEO + structured data + sitemaps                          | Blog renders MDX; LocalBusiness JSON-LD; sitemap.xml live           |
| 8     | Polish: animations, image perf, accessibility audit              | WCAG AA; LCP < 2s on portfolio                                      |
| 9     | Launch checklist (see §11)                                       | Live on lensofdhruv.com with live Stripe                            |

---

## 11. Launch Checklist (gate before flipping Stripe to live mode)

- [ ] All §7.3 E2E flows passing for 7 consecutive days on `preview`
- [ ] Sentry catching errors; alerts wired to email
- [ ] Backup strategy: Neon point-in-time recovery enabled; weekly logical backups to R2
- [ ] R2 bucket lifecycle: archived galleries → cheaper storage class after 90 days
- [ ] DNS: lensofdhruv.com → Vercel; SSL valid; www redirect
- [ ] Email DKIM/SPF/DMARC configured for sending domain
- [ ] Stripe live keys in Vercel prod env only; restricted API key (not full secret)
- [ ] Privacy policy + Terms of Service pages live (required by Stripe)
- [ ] Cookie/analytics disclosure (Umami is cookieless; still disclose in privacy policy)
- [ ] Load test booking flow at 10 req/s (Artillery or k6)
- [ ] Manual end-to-end test on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari
- [ ] Refund flow tested with real test-mode charge
- [ ] Drone Part 107 licensing reflected in About page disclosures

---

## 12. Operational Runbook (live keep)

- **Daily:** check Sentry dashboard, Vercel deploy log
- **Weekly:** review bookings/payments reconciliation (Stripe vs DB), confirm no orphaned `pending` bookings > 48h
- **Monthly:** rotate `AUTH_SECRET`, audit R2 access logs, review Neon usage vs free tier limits, run `npm audit`
- **Quarterly:** dependency upgrades (Next, Drizzle, Auth.js); restore-from-backup drill on a Neon branch

---

## 13. Open Questions / Future

- tRPC vs raw Server Actions — start with Server Actions; revisit if API surface grows
- Self-host Plausible/Umami vs Vercel Analytics — start with both, drop one after 90 days
- Multi-photographer support (assistants, second shooters) — not v1
- Native mobile app — never; PWA only if needed
- AI-assisted culling (auto-favorites, duplicate detection) — interesting v2 feature; cheap with local CLIP

---

## How Claude Code Should Use This File

1. **Treat §2 stack choices as locked.** If you propose an alternative, justify why and update this file via PR.
2. **Follow §4 folder structure.** New files go in the canonical location.
3. **Every new feature ships with tests at the appropriate layer (§7).** No exceptions.
4. **Respect env separation (§3).** Never use production credentials in dev. Never write tests that hit prod.
5. **When adding a table, update §5 here in the same PR.** Schema is documented in this file.
6. **For destructive operations (migrations, deletes), require explicit confirmation in prompts.**
7. **Cost-conscious by default.** Before adding a paid dependency, check if it can be built in <2 days; if yes, build it.
