import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const windows = await prisma.maintenanceWindow.findMany({
    where: { monitorId: id },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(windows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const window = await prisma.maintenanceWindow.create({
    data: {
      monitorId: id,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      label: body.label ?? null,
    },
  });
  return NextResponse.json(window, { status: 201 });
}
