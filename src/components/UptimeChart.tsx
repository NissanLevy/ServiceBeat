"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CheckResult {
  id: string;
  timestamp: string;
  passed: boolean;
  responseTime: number;
  statusCode: number | null;
  failureReason: string | null;
}

interface Props {
  results: CheckResult[];
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function UptimeChart({ results }: Props) {
  const ordered = [...results].reverse();

  const chartData = ordered.map((r) => ({
    time: formatTime(r.timestamp),
    responseTime: r.passed ? r.responseTime : null,
    failed: r.passed ? null : r.responseTime,
  }));

  return (
    <div className="space-y-6">
      {/* Status timeline */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status Timeline</p>
        <div className="flex gap-0.5 h-8">
          {ordered.map((r) => (
            <div
              key={r.id}
              title={`${formatTime(r.timestamp)} — ${r.passed ? `${r.responseTime}ms` : r.failureReason}`}
              className={`flex-1 rounded-sm ${r.passed ? "bg-green-500" : "bg-red-500"}`}
            />
          ))}
          {results.length === 0 && (
            <p className="text-gray-500 text-sm self-center">No data yet</p>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          {ordered.length > 0 && (
            <>
              <span>{formatTime(ordered[0].timestamp)}</span>
              <span>{formatTime(ordered[ordered.length - 1].timestamp)}</span>
            </>
          )}
        </div>
      </div>

      {/* Response time chart */}
      {ordered.length > 1 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Response Time (ms)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 6 }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#3b82f6" }}
                formatter={(v) => [`${v}ms`, "Response time"]}
              />
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#rtGradient)"
                connectNulls={false}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                strokeWidth={2}
                fill="none"
                connectNulls={false}
                dot={{ r: 4, fill: "#ef4444" }}
                activeDot={{ r: 5, fill: "#ef4444" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
