import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("monitorId");

  const results = await prisma.checkResult.findMany({
    where: monitorId ? { monitorId } : undefined,
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return NextResponse.json(results);
}
