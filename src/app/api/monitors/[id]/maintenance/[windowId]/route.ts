import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; windowId: string }> }
) {
  const { windowId } = await params;
  await prisma.maintenanceWindow.delete({ where: { id: windowId } });
  return new NextResponse(null, { status: 204 });
}
