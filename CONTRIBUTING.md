# Contributing to ServiceBeat

## Development setup

### Prerequisites

- Node.js 22+
- Docker Desktop

### 1. Start infrastructure

```bash
npm run infra:up         # postgres, redis, pgadmin
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

```env
DATABASE_URL=postgresql://servicebeat:servicebeat@localhost:5433/servicebeat
REDIS_URL=redis://localhost:6379
AUTH_SECRET=any-random-string-for-local-dev
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin
```

### 3. Set up the database

```bash
npm run db:migrate
npm run seed
```

### 4. Run the app

```bash
npm run dev       # web app — http://localhost:3000
npm run worker    # background worker (separate terminal)
```

## Making changes

- **TypeScript** — run `npx tsc --noEmit` before submitting. CI will fail if there are type errors.
- **Style** — match the surrounding code. No new dependencies without discussion.
- **Scope** — keep PRs focused. One feature or fix per PR.
- **Comments** — only when the *why* is non-obvious. Don't describe what the code does.

## Database changes

Any schema change needs a migration:

```bash
npm run db:migrate       # creates and applies the migration
```

Commit the generated file in `prisma/migrations/`.

## Submitting a pull request

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` and fix any errors
4. Open a PR with a clear description of what changed and why

## Reporting bugs

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- ServiceBeat version / deployment method (Docker / local dev)
