# ServiceBeat

Self-hosted API health monitoring with custom assertions, multi-channel alerting, and incident tracking. Runs entirely in Docker. Installable as a PWA.

## Features

- **Custom assertions** — check status codes, response body keywords, JSONPath values, response time thresholds, and SSL certificate expiry
- **Request headers & body** — send custom headers and JSON/text body with each check
- **Multi-channel alerts** — email, Slack, generic webhook, and PagerDuty; fires on state change (triggered / resolved)
- **Consecutive failure threshold** — only alert after N consecutive failures to reduce noise
- **Incident tracking** — automatically opens and closes incidents, tracks outage duration
- **Maintenance windows** — schedule downtime windows per monitor; alerts are suppressed during active windows
- **Pause / resume monitors** — disable a monitor without deleting it
- **Services grouping** — organise monitors into services for a cleaner dashboard
- **Public status page** — shareable `/status` page, no login required; per-monitor visibility control
- **API tokens** — programmatic access to create, manage, and query monitors without a browser session
- **User management** — multi-user with admin and member roles
- **Password expiry** — passwords expire after 6 months and users are prompted to change them
- **Uptime chart** — status timeline and response time graph per monitor; uptime % shown on dashboard cards
- **PWA** — installable as a desktop or mobile app directly from the browser

## Stack

| Layer | Technology |
|---|---|
| Web | Next.js 15 (App Router) |
| Database | PostgreSQL 17 + Prisma 5 |
| Queue | BullMQ + Redis 7 |
| Auth | NextAuth v5 (JWT, credentials) |
| Charts | Recharts |
| Styling | Tailwind CSS 4 |

## Running with Docker (recommended)

### 1. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.docker.example .env.docker
```

Required variables:

```env
DATABASE_URL=postgresql://servicebeat:servicebeat@postgres:5432/servicebeat
REDIS_URL=redis://redis:6379

AUTH_SECRET=<random 32+ char string>

ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<your initial admin password>

# SMTP for email alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=alerts@yourdomain.com

RETENTION_DAYS=90
```

### 2. Start everything

```bash
npm run docker:up
```

This builds and starts 5 containers: `web`, `worker`, `postgres`, `redis`, and `pgadmin`.

On first startup the web container runs migrations and creates the admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Subsequent restarts skip user creation if the account already exists.

### 3. Configure your domain

Edit `docker/caddy/Caddyfile` and replace `your-domain.com` with your actual domain or IP:

```
# Public domain — Caddy gets a Let's Encrypt cert automatically
monitor.example.com {
    reverse_proxy web:3000
}

# LAN / local IP — Caddy uses a self-signed cert
192.168.1.100 {
    reverse_proxy web:3000
}
```

For a public domain, point your DNS A record at the server's IP before starting. Caddy handles certificate issuance and renewal automatically — ports 80 and 443 must be reachable.

### 4. Open the app

| Service | URL |
|---|---|
| Web app | https://your-domain.com |
| Public status page | https://your-domain.com/status |
| pgAdmin | http://your-server-ip:5050 |

Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set.

### Useful commands

```bash
npm run docker:logs      # tail all container logs
npm run docker:down      # stop everything
```

### Testing the full Docker stack locally

Set `docker/caddy/Caddyfile` to `localhost`, then `npm run docker:up`. Caddy will use a self-signed cert — accept the browser warning once, or run `caddy trust` to install Caddy's local CA and eliminate the warning permanently.

## Local development

Caddy is only used in the full Docker stack. For day-to-day development you run the web app and worker directly — no HTTPS needed.

### 1. Start infrastructure only

```bash
npm run infra:up         # starts postgres, redis, pgadmin
```

### 2. Configure environment

```bash
cp .env.example .env
# fill in DATABASE_URL, REDIS_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

### 3. Set up the database

```bash
npm run db:migrate       # run migrations
npm run seed             # create admin user
```

### 4. Run the app

```bash
npm run dev              # Next.js dev server (http://localhost:3000)
npm run worker           # background check worker (separate terminal)
```

### Windows — Postgres connection issue

Docker Desktop on Windows routes `localhost` port mappings through a proxy that can reject Postgres connections before they reach the container. If `npm run db:migrate` fails with an authentication error even though credentials are correct, see [`docs/windows-docker-networking.md`](docs/windows-docker-networking.md) for the fix and workaround scripts:

```bash
npm run db:migrate:docker   # run migrations inside the container network
npm run seed:docker         # run seed inside the container network
```

## Assertion types

| Type | What it checks | Operators |
|---|---|---|
| Status Code | HTTP response status | eq, neq, gt, lt |
| Keyword | Response body text | contains, not equals |
| JSONPath | Value at a JSON path | eq, neq, contains, gt, lt |
| Response Time | Round-trip time in ms | lt (under), gt (over) |
| SSL Expiry | Days until certificate expires | min days remaining |

Multiple assertions are evaluated independently — all failures are reported in a single check result.

## Alert channels

| Channel | Config field | Notes |
|---|---|---|
| Email | `to` | Requires SMTP env vars |
| Slack | `url` | Incoming webhook URL |
| Webhook | `url` | POST JSON to any URL |
| PagerDuty | `integrationKey` | Auto-resolves via dedup key |

Alerts fire on state change: once when a monitor goes down (triggered) and once when it recovers (resolved). Use the **consecutive failure threshold** setting on each monitor to avoid alerts on transient blips.

### Webhook payload

```json
{
  "monitor": { "id": "...", "name": "My API", "url": "https://..." },
  "type": "triggered",
  "reason": "Status code 503",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Point this at Slack, Discord, Teams, n8n, Zapier, or any custom endpoint.

### PagerDuty setup

1. In PagerDuty, go to **Services** → your service → **Integrations** → **Add integration**
2. Select **Events API v2** and copy the **Integration Key**
3. On the monitor detail page, add an alert rule → select **PagerDuty** → paste the integration key

ServiceBeat sends a `trigger` event when the monitor goes down and a `resolve` event when it recovers. Both use the monitor ID as the dedup key so PagerDuty automatically resolves the incident — no manual cleanup needed.

## API tokens

Generate tokens under the avatar menu → **API Tokens**. Use them to access the API without a browser session:

```bash
# List all monitors
curl https://your-domain.com/api/monitors \
  -H "Authorization: Bearer sb_..."

# Get a monitor and its latest check result
curl https://your-domain.com/api/monitors/<id> \
  -H "Authorization: Bearer sb_..."

# Create a monitor
curl -X POST https://your-domain.com/api/monitors \
  -H "Authorization: Bearer sb_..." \
  -H "Content-Type: application/json" \
  -d '{ "name": "My API", "url": "https://api.example.com/health", "method": "GET" }'

# Pause a monitor
curl -X PATCH https://your-domain.com/api/monitors/<id> \
  -H "Authorization: Bearer sb_..." \
  -H "Content-Type: application/json" \
  -d '{ "active": false }'
```

Tokens are stored as SHA-256 hashes and shown only once on creation. Revoke them at any time from the API Tokens page.

## Database access (pgAdmin)

pgAdmin is available at http://localhost:5050

- **Email:** admin@servicebeat.com
- **Password:** admin
- **Host:** postgres (internal Docker hostname)
- **Port:** 5432
- **Database:** servicebeat
- **Username:** servicebeat
