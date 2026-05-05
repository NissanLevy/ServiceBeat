import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateToken, hashToken, tokenPrefix } from "@/lib/apiToken";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
  });
  return NextResponse.json(tokens);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const raw = generateToken();
  const token = await prisma.apiToken.create({
    data: {
      name: name.trim(),
      tokenHash: hashToken(raw),
      prefix: tokenPrefix(raw),
      userId: session.user.id,
    },
  });

  return NextResponse.json({ ...token, rawToken: raw }, { status: 201 });
}
