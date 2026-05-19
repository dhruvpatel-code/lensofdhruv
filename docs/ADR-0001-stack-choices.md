# ADR-0001: Initial stack choices

- **Status:** Accepted
- **Date:** 2026-05-19
- **Phase:** 0 — scaffold

## Context

Lens of Dhruv is a one-photographer SaaS-style product: marketing site, client portal, admin dashboard, all running on a Hobby/free-tier budget. The full rationale lives in `CLAUDE.md` (§1, §2); this ADR records the choices that anchor every subsequent decision.

## Decision

| Layer            | Choice                                        | Pinned version (Phase 0) |
| ---------------- | --------------------------------------------- | ------------------------ |
| Framework        | Next.js (App Router) + TypeScript             | `^15.5.0`                |
| UI               | React                                         | `^19.2.0`                |
| Styling          | Tailwind CSS v4 + shadcn/ui                   | `^4.3.0`                 |
| Database         | Neon Postgres (serverless branches per env)   | n/a                      |
| ORM              | Drizzle ORM + `drizzle-kit`                   | landed in M6             |
| Auth             | Auth.js v5 (NextAuth beta) — magic links only | landed in M7             |
| Email            | Resend (3k/mo free tier)                      | landed in M7             |
| Payments         | Stripe — webhook-driven                       | Phase 3                  |
| File storage     | Cloudflare R2 (zero egress)                   | Phase 5                  |
| Hosting          | Vercel (Hobby)                                | M10                      |
| Error monitoring | Sentry (free tier)                            | Phase 9                  |
| Testing          | Vitest + Playwright + Testing Library         | landed in M9             |
| Package manager  | npm                                           | M1                       |

## Why this set

- **Cost philosophy.** Every paid SaaS has a self-hostable or free-tier alternative we can adopt without a monthly fee. Stripe is the only paid-per-transaction dependency.
- **Edge compatibility.** Next.js App Router + Neon HTTP driver + Auth.js v5 all run on the Edge runtime, so middleware can hit the DB cheaply.
- **Drizzle over Prisma.** SQL-first, smaller bundle, no migration server, plays well with Neon's HTTP driver — the deciding factor for edge auth checks.
- **Magic links over passwords.** Removes the password-handling surface entirely; Resend's free tier covers the expected volume.
- **CLAUDE.md §13 rule:** any deviation from this table requires a new ADR + a CLAUDE.md PR. None made yet.

## Consequences

- Locked into the React 19 / Next 15 line for Phase 0. Next 16 is available as of 2026-05-19 but staying on 15 matches `CLAUDE.md` §2; revisit before Phase 1 if there's a compelling reason to bump.
- Vercel Hobby has bandwidth and build-minute ceilings — acceptable for a single-photographer audience but worth monitoring once marketing traffic ramps.
- Auth.js v5 is still tagged `beta` on npm. Risk is API churn; mitigation is pinning the exact version once we adopt it in M7.
