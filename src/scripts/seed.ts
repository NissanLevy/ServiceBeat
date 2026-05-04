import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, password: hashed, role: "admin", passwordChangedAt: new Date() } });
  console.log(`Admin user created: ${email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
