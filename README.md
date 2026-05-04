# ServiceBeat

Self-hosted API health monitoring with custom assertions, multi-channel alerting, and incident tracking. Runs entirely in Docker.

## Features

- **Custom assertions** — check status codes, response body keywords, JSONPath values, and response time thresholds
- **Multi-channel alerts** — email, Slack, and webhooks; fires on state change (triggered / resolved)
- **Incident tracking** — automatically opens and closes incidents, tracks outage duration
- **Services grouping** — organise monitors into services for a cleaner dashboard
- **Public status page** — shareable `/status` page, no login required; per-monitor visibility control
- **User management** — multi-user with admin and member roles
- **Password expiry** — passwords expire after 6 months and users are prompted to change them
- **Uptime chart** — status timeline and response time graph per monitor

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

The web app runs migrations and seeds the admin user automatically on startup.

### 3. Open the app

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Public status page | http://localhost:3000/status |
| pgAdmin | http://localhost:5050 |

Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set.

### Useful commands

```bash
npm run docker:logs      # tail all container logs
npm run docker:down      # stop everything
```

## Local development

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

## Assertion types

| Type | What it checks | Operators |
|---|---|---|
| Status Code | HTTP response status | eq, neq, gt, lt |
| Keyword | Response body text | contains, not equals |
| JSONPath | Value at a JSON path | eq, neq, contains, gt, lt |
| Response Time | Round-trip time in ms | lt (under), gt (over) |

Multiple assertions are evaluated independently — all failures are reported in a single check result.

## Alert channels

| Channel | Config fields |
|---|---|
| Email | `to` |
| Slack | `url` (incoming webhook URL) |
| Webhook | `url` |
| PagerDuty | `integrationKey` |

Alerts fire on state change: once when a monitor goes down (triggered) and once when it recovers (resolved).

### PagerDuty setup

1. In PagerDuty, go to **Services** → your service → **Integrations** → **Add integration**
2. Select **Events API v2** and copy the **Integration Key**
3. On the monitor detail page, add an alert rule → select **PagerDuty** → paste the integration key

ServiceBeat sends a `trigger` event when the monitor goes down and a `resolve` event when it recovers. Both use the monitor ID as the dedup key so PagerDuty automatically resolves the incident — no manual cleanup needed.

## Database access (pgAdmin)

pgAdmin is available at http://localhost:5050

- **Email:** admin@servicebeat.com
- **Password:** admin
- **Host:** postgres (internal Docker hostname)
- **Port:** 5432
- **Database:** servicebeat
- **Username:** servicebeat
