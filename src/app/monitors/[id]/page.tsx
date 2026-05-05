import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import PauseButton from "./PauseButton";
import AutoRefresh from "@/components/AutoRefresh";
import AlertsManager from "@/components/AlertsManager";
import MaintenanceManager from "@/components/MaintenanceManager";
import UptimeChart from "@/components/UptimeChart";

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

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const [monitor, incidents, alertEvents, maintenanceWindows] = await Promise.all([
    prisma.monitor.findUnique({
      where: { id },
      include: {
        results: { orderBy: { timestamp: "desc" }, take: 100 },
        alertRules: true,
      },
    }),
    prisma.incident.findMany({
      where: { monitorId: id },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    prisma.alertEvent.findMany({
      where: { monitorId: id },
      orderBy: { sentAt: "desc" },
      take: 30,
      include: { rule: { select: { channel: true, config: true } } },
    }),
    prisma.maintenanceWindow.findMany({
      where: { monitorId: id },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  if (!monitor) notFound();

  const openIncident = incidents.find((i) => !i.resolvedAt) ?? null;
  const pastIncidents = incidents.filter((i) => i.resolvedAt);
  const activeMaintenance = maintenanceWindows.find(
    (w) => w.startsAt <= now && now <= w.endsAt
  ) ?? null;

  const upCount = monitor.results.filter((r) => r.passed).length;
  const total = monitor.results.length;
  const uptime = total > 0 ? ((upCount / total) * 100).toFixed(1) : "—";
  const avgResponse =
    total > 0
      ? Math.round(monitor.results.reduce((s, r) => s + r.responseTime, 0) / total)
      : null;

  const nowMs = now.getTime();

  return (
    <div>
      <AutoRefresh intervalMs={15000} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Monitors
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold">{monitor.name}</h1>
            {!monitor.active && (
              <span className="text-xs font-medium px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                PAUSED
              </span>
            )}
            {activeMaintenance && (
              <span className="text-xs font-medium px-2 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">
                MAINTENANCE
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-0.5">{monitor.url}</p>
        </div>
        <div className="flex items-center gap-3">
          <PauseButton monitorId={monitor.id} active={monitor.active} />
          <Link
            href={`/monitors/${monitor.id}/edit`}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md transition-colors"
          >
            Edit
          </Link>
          <DeleteButton monitorId={monitor.id} />
        </div>
      </div>

      {activeMaintenance && (
        <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg px-5 py-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-semibold text-sm">Maintenance window active</span>
            <span className="text-blue-500 text-sm">— alerts suppressed</span>
          </div>
          <p className="text-xs text-blue-500/80 mt-1">
            Until {activeMaintenance.endsAt.toLocaleString("en-US", { timeZone: "UTC" })} UTC
            {activeMaintenance.label && ` — ${activeMaintenance.label}`}
          </p>
        </div>
      )}

      {openIncident && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg px-5 py-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-semibold text-sm">Incident active</span>
            <span className="text-red-500 text-sm">— down for {formatDuration(nowMs - openIncident.startedAt.getTime())}</span>
          </div>
          <p className="text-xs text-red-500/80">
            Started {openIncident.startedAt.toLocaleString("en-US", { timeZone: "UTC" })} UTC
          </p>
          {openIncident.failureReason && (
            <div className="text-xs text-red-400 mt-1 space-y-0.5">
              {openIncident.failureReason.split("\n").map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-5 mb-6">
        <UptimeChart results={monitor.results.map(r => ({
          ...r,
          timestamp: r.timestamp.toISOString(),
        }))} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Uptime (last 100)" value={`${uptime}%`} />
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
        Notification History
      </h2>
      <div className="mb-8 space-y-2">
        {alertEvents.length === 0 && (
          <p className="text-gray-500 text-sm">No notifications sent yet.</p>
        )}
        {alertEvents.map((event) => {
          const config = event.rule.config as Record<string, string>;
          const destination =
            event.rule.channel === "email" ? config.to
            : event.rule.channel === "pagerduty" ? `${config.integrationKey?.slice(0, 8)}…`
            : config.url ? new URL(config.url).hostname
            : "—";
          return (
            <div key={event.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-md px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                  event.type === "triggered"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/20"
                }`}>
                  {event.type}
                </span>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded capitalize">
                  {event.rule.channel}
                </span>
                <span className="text-gray-400 text-xs truncate max-w-xs">{destination}</span>
              </div>
              <span className="text-gray-500 text-xs">
                {event.sentAt.toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} UTC
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Maintenance Windows
      </h2>
      <div className="mb-8">
        <MaintenanceManager
          monitorId={monitor.id}
          initialWindows={maintenanceWindows.map((w) => ({
            ...w,
            startsAt: w.startsAt.toISOString(),
            endsAt: w.endsAt.toISOString(),
          }))}
        />
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Incident History
      </h2>
      <div className="mb-8 space-y-2">
        {incidents.length === 0 && (
          <div className="flex items-center gap-3 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/servicebeat-empty-no-incidents.svg" alt="" className="w-8 h-8 opacity-50" />
            <p className="text-gray-500 text-sm">No incidents recorded yet.</p>
          </div>
        )}
        {incidents.map((inc) => {
          const duration = inc.resolvedAt
            ? formatDuration(inc.resolvedAt.getTime() - inc.startedAt.getTime())
            : formatDuration(nowMs - inc.startedAt.getTime());
          return (
            <div
              key={inc.id}
              className={`bg-gray-900 border rounded-md px-4 py-3 text-sm ${!inc.resolvedAt ? "border-red-900/50" : "border-gray-800"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${inc.resolvedAt ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-gray-300">
                    {inc.startedAt.toLocaleString("en-US", { timeZone: "UTC" })} UTC
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-xs">
                  <span>{duration}</span>
                  <span className={inc.resolvedAt ? "text-green-500" : "text-red-400"}>
                    {inc.resolvedAt ? "resolved" : "ongoing"}
                  </span>
                </div>
              </div>
              {inc.failureReason && (
                <div className="text-xs text-red-400 mt-1.5 pl-5 space-y-0.5">
                  {inc.failureReason.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Recent Checks
      </h2>
      <div className="space-y-2">
        {monitor.results.map((r) => {
          const failures = r.failureReason ? r.failureReason.split("\n") : [];
          return (
            <div
              key={r.id}
              className={`bg-gray-900 border rounded-md px-4 py-3 text-sm ${!r.passed ? "border-red-900/50" : "border-gray-800"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${r.passed ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-gray-300">{new Date(r.timestamp).toLocaleString("en-US", { timeZone: "UTC" })} UTC</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  {r.statusCode && <span>HTTP {r.statusCode}</span>}
                  <span>{r.responseTime}ms</span>
                </div>
              </div>
              {failures.length > 0 && (
                <div className="mt-2 pl-5 space-y-0.5">
                  {failures.map((f, i) => (
                    <p key={i} className="text-red-400 text-xs">{f}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
