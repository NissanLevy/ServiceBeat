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
      ...(body.name       !== undefined && { name: body.name }),
      ...(body.url        !== undefined && { url: body.url }),
      ...(body.method     !== undefined && { method: body.method }),
      ...(body.headers    !== undefined && { headers: body.headers }),
      ...(body.body       !== undefined && { body: body.body }),
      ...(body.interval   !== undefined && { interval: body.interval }),
      ...(body.assertions !== undefined && { assertions: body.assertions }),
      ...(body.serviceId  !== undefined && { serviceId: body.serviceId }),
      ...(body.active            !== undefined && { active: body.active }),
      ...(body.showOnStatusPage  !== undefined && { showOnStatusPage: body.showOnStatusPage }),
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
