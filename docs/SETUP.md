# Local setup

Phase 0 scaffold — instructions for getting a working dev environment.

## Prerequisites

- Node.js `>=20` (check `.nvmrc` — pinned to 22)
- npm 10+
- Git
- A Neon account (free tier)
- A Resend account (free tier — 3k/mo)

## 1. Install dependencies

```bash
npm install
```

## 2. Create your `.env.local`

```bash
cp .env.example .env.local
```

Then fill in:

- **`DATABASE_URL`** — open [Neon Console](https://console.neon.tech), create a project (or use an existing one), create a branch named `dev`, copy the pooled connection string.
- **`AUTH_SECRET`** — generate with `openssl rand -base64 32` (or use any 32+ char random string).
- **`AUTH_URL`** — leave as `http://localhost:3000` for local.
- **`RESEND_API_KEY`** — [Resend dashboard](https://resend.com/api-keys) → create an API key.
- **`EMAIL_FROM`** — keep the default (`onboarding@resend.dev`) until your domain is verified.

Leave Stripe / R2 / Sentry keys blank — they're not used in Phase 0.

## 3. Apply database migrations

With `DATABASE_URL` set to your Neon `dev` branch:

```bash
npm run db:migrate
```

This runs `drizzle/0000_*.sql` against the branch and creates the `users`, `accounts`, `sessions`, `verification_tokens` tables plus the `user_role` enum.

Verify visually with:

```bash
npm run db:studio
```

## 4. Run the app

```bash
npm run dev
```

Visit <http://localhost:3000>.

Health check: `curl http://localhost:3000/api/health` should return `{ "ok": true, "db": "up", ... }` once Milestone 8 lands.

## Useful scripts

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Next.js dev server with hot reload                   |
| `npm run build`        | Production build                                     |
| `npm run typecheck`    | `tsc --noEmit` — no errors permitted                 |
| `npm run lint`         | ESLint (flat config)                                 |
| `npm run format`       | Prettier in write mode                               |
| `npm run format:check` | Prettier in check mode (CI uses this)                |
| `npm run db:generate`  | Generate a new migration from schema diffs           |
| `npm run db:migrate`   | Apply pending migrations to `DATABASE_URL`           |
| `npm run db:push`      | Sync schema to DB without migration files (dev only) |
| `npm run db:studio`    | Open Drizzle Studio in browser                       |
