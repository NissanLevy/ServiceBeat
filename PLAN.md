# ServiceBeat — API Health Monitor

## Overview
A self-hosted, Dockerized API health monitoring application with custom response assertions and multi-channel alerting.

## Stack

| Concern | Choice |
|---|---|
| Frontend | Next.js (App Router) |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| API | Next.js API Routes |
| ORM | Prisma |
| Queue | BullMQ |
| Queue Broker | Redis |
| Database | PostgreSQL |
| Email | Nodemailer |

## Docker Services

| Service | Role |
|---|---|
| `web` | Next.js — UI + API routes + Prisma |
| `worker` | Node.js — BullMQ worker only |
| `postgres` | PostgreSQL database |
| `redis` | BullMQ broker |

## Folder Structure

```
/
├── src/
│   ├── app/                        — Next.js App Router
│   │   ├── (dashboard)/            — UI pages
│   │   │   ├── page.tsx            — Monitor list / dashboard
│   │   │   ├── monitors/[id]/      — Monitor detail + check history
│   │   │   └── monitors/new/       — Create monitor form
│   │   └── api/                    — API routes
│   │       ├── monitors/
│   │       ├── checks/
│   │       └── alerts/
│   ├── lib/
│   │   ├── checker/                — HTTP runner + assertion engine
│   │   ├── alerts/                 — Alert channels (email, slack, webhook, pagerduty)
│   │   ├── queue/                  — BullMQ job definitions (shared with worker)
│   │   └── prisma.ts               — Prisma client singleton
│   └── worker/
│       └── index.ts                — BullMQ worker entry point (separate container)
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── Dockerfile.web
├── Dockerfile.worker
└── PLAN.md
```

## Database Schema

```prisma
Monitor {
  id          String    @id @default(cuid())
  name        String
  url         String
  method      String          // GET, POST, etc.
  headers     Json?
  body        Json?
  interval    Int             // seconds
  assertions  Json            // array of assertion objects
  active      Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  results     CheckResult[]
  alertRules  AlertRule[]
}

CheckResult {
  id            String    @id @default(cuid())
  monitorId     String
  monitor       Monitor   @relation(...)
  timestamp     DateTime  @default(now())
  passed        Boolean
  statusCode    Int?
  responseTime  Int             // ms
  failureReason String?
}

AlertRule {
  id        String    @id @default(cuid())
  monitorId String
  monitor   Monitor   @relation(...)
  channel   String          // email | slack | webhook | pagerduty
  config    Json            // { to: "email" } | { url: "..." }
}

AlertEvent {
  id        String    @id @default(cuid())
  monitorId String
  ruleId    String
  sentAt    DateTime  @default(now())
  type      String          // triggered | resolved
}
```

## Assertion Schema (per phase)

```ts
// Phase A — status code check
{ type: "status_code", operator: "eq", value: 200 }

// Phase A ext — keyword in response body
{ type: "keyword", operator: "contains", value: "ok" }

// Phase B — JSONPath assertion
{ type: "jsonpath", path: "$.data.status", operator: "eq", value: "active" }
// operators: eq | neq | contains | gt | lt

// Phase C — multiple assertions (array, all must pass)
[
  { type: "status_code", operator: "eq", value: 200 },
  { type: "jsonpath", path: "$.data.active", operator: "eq", value: true }
]
```

## Alert Channels

| Channel | Phase |
|---|---|
| Email (SMTP via Nodemailer) | Phase 1 |
| Slack webhook | Phase 2 |
| Generic webhook | Phase 2 |
| PagerDuty | Phase 3 |

## Implementation Phases

### Phase 1 — Foundation
- [ ] Project scaffold (Next.js + TypeScript + Tailwind + shadcn/ui)
- [ ] Docker Compose (web + worker + postgres + redis)
- [ ] Prisma schema + migrations
- [ ] BullMQ: enqueue repeat jobs per monitor on interval
- [ ] Checker: HTTP request → status code assertion only
- [ ] API routes: CRUD monitors + list check results
- [ ] Email alert on failure + recovery
- [ ] React UI: monitor list, create/edit form, status indicators

### Phase 2 — Keyword + JSONPath Assertions
- [ ] Extend checker: keyword scan on response body
- [ ] Extend checker: jsonpath-plus + operators (eq, neq, contains, gt, lt)
- [ ] UI: assertion builder in monitor form
- [ ] Alert channels: Slack webhook + generic webhook

### Phase 3 — Multiple Assertions + PagerDuty
- [ ] Checker: iterate assertion array, report first failure
- [ ] UI: multi-assertion UI in form
- [ ] Alert channel: PagerDuty

### Phase 4 — Custom Script (TBD)
- [ ] Discuss security model before implementing
