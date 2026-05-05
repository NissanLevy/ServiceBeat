import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";

export function generateToken(): string {
  return "sb_" + randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenPrefix(token: string): string {
  return token.slice(0, 10); // "sb_XXXXXXX"
}

export async function validateApiToken(raw: string): Promise<boolean> {
  const token = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!token) return false;
  prisma.apiToken
    .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return true;
}
