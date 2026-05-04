import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export const revalidate = 0;

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-400 text-sm mt-1">Manage who has access to ServiceBeat.</p>
      </div>
      <UsersClient
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session.user.id!}
      />
    </div>
  );
}
