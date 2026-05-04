import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AutoRefresh from "@/components/AutoRefresh";

export const revalidate = 0;

export default async function DashboardPage() {
  const [monitors, services] = await Promise.all([
    prisma.monitor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        results: { orderBy: { timestamp: "desc" }, take: 1 },
        service: true,
      },
    }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
  ]);

  const grouped = services.map((s) => ({
    service: s,
    monitors: monitors.filter((m) => m.serviceId === s.id),
  })).filter((g) => g.monitors.length > 0);

  const ungrouped = monitors.filter((m) => !m.serviceId);

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

      <div className="space-y-6">
        {grouped.map(({ service, monitors: sMonitors }) => (
          <div key={service.id}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {service.name}
            </h2>
            <div className="space-y-2">
              {sMonitors.map((m) => <MonitorRow key={m.id} monitor={m} />)}
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div>
            {grouped.length > 0 && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Ungrouped
              </h2>
            )}
            <div className="space-y-2">
              {ungrouped.map((m) => <MonitorRow key={m.id} monitor={m} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MonitorRow({ monitor }: { monitor: { id: string; name: string; url: string; interval: number; active: boolean; results: { passed: boolean }[] } }) {
  const last = monitor.results[0];
  const status = !monitor.active ? "paused" : !last ? "pending" : last.passed ? "up" : "down";

  return (
    <Link
      href={`/monitors/${monitor.id}`}
      className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 hover:border-gray-600 transition-colors"
    >
      <div>
        <p className={`font-medium ${monitor.active ? "text-white" : "text-gray-500"}`}>{monitor.name}</p>
        <p className="text-sm text-gray-400 mt-0.5">{monitor.url}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">every {monitor.interval}s</span>
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: "up" | "down" | "pending" | "paused" }) {
  const styles = {
    up: "bg-green-500/10 text-green-400 border-green-500/20",
    down: "bg-red-500/10 text-red-400 border-red-500/20",
    paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
