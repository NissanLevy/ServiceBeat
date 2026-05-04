import { prisma } from "@/lib/prisma";
import ServicesClient from "./ServicesClient";

export const revalidate = 0;

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { monitors: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
      </div>
      <ServicesClient initialServices={services} />
    </div>
  );
}
