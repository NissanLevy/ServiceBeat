import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const rule = await prisma.alertRule.create({
    data: {
      monitorId: id,
      channel: body.channel,
      config: body.config,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rules = await prisma.alertRule.findMany({ where: { monitorId: id } });
  return NextResponse.json(rules);
}
