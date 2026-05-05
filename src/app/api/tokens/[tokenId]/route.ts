import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tokenId } = await params;
  await prisma.apiToken.deleteMany({
    where: { id: tokenId, userId: session.user.id },
  });
  return new NextResponse(null, { status: 204 });
}
