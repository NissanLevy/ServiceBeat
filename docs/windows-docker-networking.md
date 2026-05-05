# Windows Docker Desktop: Postgres connection issue in local dev

## Symptom

`npm run db:migrate` (or any Prisma/pg command run from Windows) fails with:

```
Error: P1000: Authentication failed against database server at `localhost`
```

This happens even though:
- The Postgres container is healthy
- The credentials in `.env` are correct
- `pg_hba.conf` inside the container is set to `trust`
- The error never appears in Postgres logs

## Root cause

Docker Desktop on Windows routes `localhost` port mappings through a networking layer called **VPNKit with a transparent proxy** (`NetworkType: gvisor`, `VpnKitTransparentProxy: true`). This proxy intercepts TCP connections to mapped ports before they reach the container.

When a Postgres client connects, the proxy initiates its own SCRAM-SHA-256 handshake. Since the proxy has no knowledge of actual Postgres credentials, it always rejects the connection — generating a fake `password authentication failed` error that looks like it came from Postgres but didn't. No amount of `pg_hba.conf` changes or password resets will fix this because the connection never reaches the container.

## Fix

In Docker Desktop go to **Settings → Resources → Network** and enable **"Enable host networking"**. Fully quit and restart Docker Desktop (tray icon → Quit, then reopen).

After restart, bring infra back up:

```bash
npm run infra:up
```

You may also need to reset the Postgres user password since the volume may have been initialised with a different encryption method:

```bash
docker exec servicebeat-postgres-1 sh -c "psql -U servicebeat -c \"ALTER USER servicebeat PASSWORD 'your-password'\""
```

## Workaround (without changing Docker Desktop settings)

Run migrations and seed inside the Docker network directly, bypassing the proxy entirely. This requires the worker image to already be built (`npm run docker:up` at least once).

```bash
# Run migrations
docker run --rm --network servicebeat_default \
  -e DATABASE_URL="postgresql://servicebeat:your-password@postgres:5432/servicebeat" \
  servicebeat-worker sh -c "npx prisma migrate dev"

# Run seed
docker run --rm --network servicebeat_default \
  -e DATABASE_URL="postgresql://servicebeat:your-password@postgres:5432/servicebeat" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="your-password" \
  servicebeat-worker sh -c "npx tsx src/scripts/seed.ts"
```
