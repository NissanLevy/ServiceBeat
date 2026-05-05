import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleMonitor } from "@/lib/queue/jobs";
import { validateApiToken } from "@/lib/apiToken";

async function authorized(req: Request): Promise<boolean> {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return validateApiToken(bearer.slice(7));
  return true; // middleware already verified session
}

export async function GET(req: Request) {
  if (!await authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: { orderBy: { timestamp: "desc" }, take: 1 },
    },
  });
  return NextResponse.json(monitors);
}

export async function POST(req: Request) {
  if (!await authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const monitor = await prisma.monitor.create({
    data: {
      name: body.name,
      url: body.url,
      method: body.method ?? "GET",
      headers: body.headers ?? {},
      body: body.body ?? null,
      interval: body.interval ?? 60,
      assertions: body.assertions ?? [{ type: "status_code", operator: "eq", value: 200 }],
      serviceId: body.serviceId ?? null,
      showOnStatusPage: body.showOnStatusPage ?? true,
      failureThreshold: body.failureThreshold ?? 1,
      active: true,
    },
  });

  scheduleMonitor(monitor.id, monitor.interval).catch((err) =>
    console.error(`Failed to schedule monitor ${monitor.id}:`, err.message)
  );

  return NextResponse.json(monitor, { status: 201 });
}
