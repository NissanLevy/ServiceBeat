import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import AutoRefresh from "@/components/AutoRefresh";
import AlertsManager from "@/components/AlertsManager";
import UptimeChart from "@/components/UptimeChart";

export const revalidate = 0;

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const monitor = await prisma.monitor.findUnique({
    where: { id },
    include: {
      results: { orderBy: { timestamp: "desc" }, take: 100 },
      alertRules: true,
    },
  });

  if (!monitor) notFound();

  const upCount = monitor.results.filter((r) => r.passed).length;
  const total = monitor.results.length;
  const uptime = total > 0 ? ((upCount / total) * 100).toFixed(1) : "—";
  const avgResponse =
    total > 0
      ? Math.round(monitor.results.reduce((s, r) => s + r.responseTime, 0) / total)
      : null;

  return (
    <div>
      <AutoRefresh intervalMs={15000} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Monitors
          </Link>
          <h1 className="text-2xl font-bold mt-1">{monitor.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{monitor.url}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/monitors/${monitor.id}/edit`}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md transition-colors"
          >
            Edit
          </Link>
          <DeleteButton monitorId={monitor.id} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-5 mb-6">
        <UptimeChart results={monitor.results.map(r => ({
          ...r,
          timestamp: r.timestamp.toISOString(),
        }))} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Uptime (last 50)" value={`${uptime}%`} />
        <StatCard label="Avg Response" value={avgResponse ? `${avgResponse}ms` : "—"} />
        <StatCard label="Interval" value={`${monitor.interval}s`} />
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Alert Rules
      </h2>
      <div className="mb-8">
        <AlertsManager
          monitorId={monitor.id}
          initialRules={monitor.alertRules as { id: string; channel: string; config: Record<string, string> }[]}
        />
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Recent Checks
      </h2>
      <div className="space-y-2">
        {monitor.results.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-md px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${r.passed ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-gray-300">
                {new Date(r.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              {r.statusCode && <span>HTTP {r.statusCode}</span>}
              <span>{r.responseTime}ms</span>
              {!r.passed && r.failureReason && (
                <span className="text-red-400 max-w-xs truncate">{r.failureReason}</span>
              )}
            </div>
          </div>
        ))}
        {monitor.results.length === 0 && (
          <p className="text-gray-500 text-sm">No checks yet — worker will run on the next interval.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
