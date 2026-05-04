import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { ruleId } = await params;
  await prisma.alertRule.delete({ where: { id: ruleId } });
  return new NextResponse(null, { status: 204 });
}
