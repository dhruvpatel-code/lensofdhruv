# Deployment runbook

## One-time setup

### 1. Neon — production + preview branches

In the [Neon Console](https://console.neon.tech) for the `lensofdhruv` project, ensure three branches exist:

| Branch    | Purpose                     |
| --------- | --------------------------- |
| `main`    | Production database         |
| `preview` | Shared preview/staging      |
| `dev`     | Personal dev (you, locally) |

Apply migrations to each branch by exporting its `DATABASE_URL` and running `npm run db:migrate`.

### 2. Resend — sending domain

1. Verify `lensofdhruv.com` (or your sending subdomain) in Resend → Domains.
2. Add the DKIM, SPF, and DMARC records Resend gives you to your DNS.
3. Once status is verified, switch `EMAIL_FROM` from `onboarding@resend.dev` to your domain.

### 3. Vercel — connect repo

1. In Vercel, **New Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Root directory: `.`.
4. Skip the env-var prompt for now — we'll set them per-environment below.

### 4. Vercel environment variables

Set these in **Project → Settings → Environment Variables**. Mark them for the environments listed.

| Variable         | Production                | Preview                    | Development (your machine via `vercel env pull`) |
| ---------------- | ------------------------- | -------------------------- | ------------------------------------------------ |
| `APP_ENV`        | `production`              | `preview`                  | `local`                                          |
| `DATABASE_URL`   | Neon `main` branch        | Neon `preview` branch      | Neon `dev` branch                                |
| `AUTH_SECRET`    | generated (32+ chars)     | same as prod or its own    | local                                            |
| `AUTH_URL`       | `https://lensofdhruv.com` | leave unset (auto)         | `http://localhost:3000`                          |
| `RESEND_API_KEY` | live Resend key           | same                       | same                                             |
| `EMAIL_FROM`     | `noreply@lensofdhruv.com` | `onboarding@resend.dev` ok | `onboarding@resend.dev`                          |

Reserved for later phases — leave unset until they're needed:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- `SENTRY_DSN`

`AUTH_URL` on preview: Auth.js v5 with `trustHost: true` (already configured in `src/lib/auth/index.ts`) will use Vercel's per-deploy URL automatically. Don't pin a value.

### 5. GitHub branch protection

In **Settings → Branches → Add rule** for `main`:

- Require pull request before merging
- Require status checks: `Lint + format`, `Typecheck`, `Unit tests`, `Build`
- Require branches up to date before merging

## Verifying Phase 0 exit criteria

After the first push to `main` + a throwaway PR:

```bash
# Production
curl https://<vercel-prod-url>/api/health
# Expect: { "ok": true, "env": "production", "db": "up", "commit": "<sha>", "time": "..." }

# Preview (from PR check URL)
curl https://<preview-url>/api/health
# Expect: { "ok": true, "env": "preview", "db": "up", ... }
```

If `db: "down"`, the Neon branch isn't reachable from the deployed function. Verify the `DATABASE_URL` you stored, then redeploy.

## Why SKIP_ENV_VALIDATION isn't set on Vercel

CI uses `SKIP_ENV_VALIDATION=true` because GitHub Actions doesn't carry production secrets. Vercel deploys do have the env vars, so we let the schema fail loudly on a misconfigured deploy.
