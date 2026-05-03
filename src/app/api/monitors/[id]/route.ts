import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleMonitor, removeMonitor } from "@/lib/queue/jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const monitor = await prisma.monitor.findUnique({
    where: { id },
    include: { results: { orderBy: { timestamp: "desc" }, take: 50 }, alertRules: true },
  });
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(monitor);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const monitor = await prisma.monitor.update({
    where: { id },
    data: {
      name: body.name,
      url: body.url,
      method: body.method,
      headers: body.headers,
      body: body.body,
      interval: body.interval,
      assertions: body.assertions,
      active: body.active,
    },
  });

  Promise.all([
    removeMonitor(id),
    monitor.active ? scheduleMonitor(id, monitor.interval) : Promise.resolve(),
  ]).catch((err) => console.error(`Failed to reschedule monitor ${id}:`, err.message));

  return NextResponse.json(monitor);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await removeMonitor(id);
  await prisma.monitor.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
