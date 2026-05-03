import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleMonitor } from "@/lib/queue/jobs";

export async function GET() {
  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: { orderBy: { timestamp: "desc" }, take: 1 },
    },
  });
  return NextResponse.json(monitors);
}

export async function POST(req: Request) {
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
      active: true,
    },
  });

  scheduleMonitor(monitor.id, monitor.interval).catch((err) =>
    console.error(`Failed to schedule monitor ${monitor.id}:`, err.message)
  );

  return NextResponse.json(monitor, { status: 201 });
}
