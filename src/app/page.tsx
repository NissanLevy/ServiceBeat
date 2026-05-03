import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AutoRefresh from "@/components/AutoRefresh";

export const revalidate = 0;

export default async function DashboardPage() {
  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: { orderBy: { timestamp: "desc" }, take: 1 },
    },
  });

  return (
    <div>
      <AutoRefresh intervalMs={15000} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Monitors</h1>
        <Link
          href="/monitors/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Add Monitor
        </Link>
      </div>

      {monitors.length === 0 && (
        <p className="text-gray-400 text-sm">No monitors yet. Create one to get started.</p>
      )}

      <div className="space-y-3">
        {monitors.map((m) => {
          const last = m.results[0];
          const status = !last ? "pending" : last.passed ? "up" : "down";

          return (
            <Link
              key={m.id}
              href={`/monitors/${m.id}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 hover:border-gray-600 transition-colors"
            >
              <div>
                <p className="font-medium text-white">{m.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{m.url}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">every {m.interval}s</span>
                <StatusBadge status={status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "up" | "down" | "pending" }) {
  const styles = {
    up: "bg-green-500/10 text-green-400 border-green-500/20",
    down: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
