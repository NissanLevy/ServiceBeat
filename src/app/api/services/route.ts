import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { monitors: true } } },
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const service = await prisma.service.create({ data: { name } });
  return NextResponse.json(service, { status: 201 });
}
