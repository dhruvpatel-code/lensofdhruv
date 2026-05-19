# lensofdhruv

Company site for Lens of Dhruv — Tampa real estate, short-term rental, and lifestyle photography.

- **Spec / architecture:** [`CLAUDE.md`](./CLAUDE.md)
- **Local setup:** [`docs/SETUP.md`](./docs/SETUP.md)
- **Deployment runbook:** [`docs/DEPLOY.md`](./docs/DEPLOY.md)
- **Architecture decisions:** [`docs/ADR-0001-stack-choices.md`](./docs/ADR-0001-stack-choices.md)

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL, AUTH_SECRET, RESEND_API_KEY
npm run db:migrate           # apply auth schema to your Neon dev branch
npm run dev                  # http://localhost:3000
```
