import { prisma } from "@/lib/prisma";

export const revalidate = 0;

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default async function StatusPage() {
  const now = Date.now();

  const [monitors, services] = await Promise.all([
    prisma.monitor.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        results: { orderBy: { timestamp: "desc" }, take: 1 },
        incidents: { where: { resolvedAt: null }, take: 1 },
        service: true,
      },
    }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
  ]);

  const downCount = monitors.filter((m) => m.incidents.length > 0).length;

  const overallStatus =
    monitors.length === 0
      ? "none"
      : downCount === 0
      ? "operational"
      : downCount < monitors.length
      ? "degraded"
      : "outage";

  const grouped = services
    .map((s) => ({ service: s, monitors: monitors.filter((m) => m.serviceId === s.id) }))
    .filter((g) => g.monitors.length > 0);

  const ungrouped = monitors.filter((m) => !m.serviceId);

  const lastChecked = monitors
    .flatMap((m) => m.results)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp ?? null;

  const bannerStyles = {
    operational: { bg: "bg-green-950/50 border-green-800/60", text: "text-green-400", dot: "bg-green-500", label: "All systems operational" },
    degraded:    { bg: "bg-yellow-950/50 border-yellow-800/60", text: "text-yellow-400", dot: "bg-yellow-500", label: "Some systems degraded" },
    outage:      { bg: "bg-red-950/50 border-red-800/60", text: "text-red-400", dot: "bg-red-500", label: "Major outage" },
    none:        { bg: "bg-gray-900 border-gray-800", text: "text-gray-400", dot: "bg-gray-500", label: "No monitors configured" },
  }[overallStatus];

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">System Status</h1>
        {lastChecked && (
          <p className="text-gray-500 text-sm">
            Last updated {lastChecked.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} UTC
          </p>
        )}
      </div>

      <div className={`border rounded-xl px-6 py-5 mb-8 flex items-center gap-3 ${bannerStyles.bg}`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${bannerStyles.dot} ${overallStatus !== "operational" && overallStatus !== "none" ? "animate-pulse" : ""}`} />
        <span className={`text-lg font-semibold ${bannerStyles.text}`}>{bannerStyles.label}</span>
        {downCount > 0 && (
          <span className="ml-auto text-sm text-gray-400">{downCount} of {monitors.length} monitor{monitors.length !== 1 ? "s" : ""} affected</span>
        )}
      </div>

      <div className="space-y-6">
        {grouped.map(({ service, monitors: sMonitors }) => (
          <section key={service.id}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {service.name}
            </h2>
            <div className="space-y-2">
              {sMonitors.map((m) => <MonitorStatusRow key={m.id} monitor={m} now={now} />)}
            </div>
          </section>
        ))}

        {ungrouped.length > 0 && (
          <section>
            {grouped.length > 0 && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Other
              </h2>
            )}
            <div className="space-y-2">
              {ungrouped.map((m) => <MonitorStatusRow key={m.id} monitor={m} now={now} />)}
            </div>
          </section>
        )}

        {monitors.length === 0 && (
          <p className="text-gray-500 text-sm">No monitors have been configured yet.</p>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center mt-12">
        Powered by ServiceBeat
      </p>
    </div>
  );
}

type Monitor = {
  id: string;
  name: string;
  results: { passed: boolean; responseTime: number }[];
  incidents: { startedAt: Date }[];
};

function MonitorStatusRow({ monitor, now }: { monitor: Monitor; now: number }) {
  const last = monitor.results[0];
  const incident = monitor.incidents[0] ?? null;
  const isDown = !!incident;
  const isPending = !last;

  return (
    <div className={`flex items-center justify-between bg-gray-900 border rounded-lg px-4 py-3 ${isDown ? "border-red-900/50" : "border-gray-800"}`}>
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isDown ? "bg-red-500 animate-pulse" : isPending ? "bg-gray-500" : "bg-green-500"}`} />
        <span className="text-sm font-medium text-white">{monitor.name}</span>
        {incident && (
          <span className="text-xs text-red-500">down {formatDuration(now - incident.startedAt.getTime())}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {last && !isDown && (
          <span className="text-xs text-gray-500">{last.responseTime}ms</span>
        )}
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
          isDown
            ? "bg-red-500/10 text-red-400 border-red-500/20"
            : isPending
            ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
            : "bg-green-500/10 text-green-400 border-green-500/20"
        }`}>
          {isDown ? "DOWN" : isPending ? "PENDING" : "UP"}
        </span>
      </div>
    </div>
  );
}
