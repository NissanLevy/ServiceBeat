"use client";

import { useState, type FormEvent } from "react";

interface Window { id: string; label: string | null; startsAt: string; endsAt: string; }

interface Props {
  monitorId: string;
  initialWindows: Window[];
}

export default function MaintenanceManager({ monitorId, initialWindows }: Props) {
  const [windows, setWindows] = useState<Window[]>(initialWindows);
  const [form, setForm] = useState({ label: "", startsAt: "", endsAt: "" });
  const [saving, setSaving] = useState(false);

  async function addWindow(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/monitors/${monitorId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label.trim() || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }),
    });
    const w = await res.json();
    setWindows((prev) => [...prev, w].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    setForm({ label: "", startsAt: "", endsAt: "" });
    setSaving(false);
  }

  async function remove(id: string) {
    await fetch(`/api/monitors/${monitorId}/maintenance/${id}`, { method: "DELETE" });
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }

  const nowIso = new Date().toISOString();

  return (
    <div className="space-y-2">
      {windows.length === 0 && (
        <p className="text-gray-500 text-sm">No maintenance windows scheduled.</p>
      )}
      {windows.map((w) => {
        const active = w.startsAt <= nowIso && nowIso <= w.endsAt;
        const past = w.endsAt < nowIso;
        return (
          <div
            key={w.id}
            className={`flex items-center justify-between bg-gray-900 border rounded-md px-4 py-3 text-sm ${
              active ? "border-yellow-700/50" : "border-gray-800"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {active && (
                <span className="text-xs px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  active
                </span>
              )}
              <span className={past ? "text-gray-600" : "text-gray-300"}>
                {new Date(w.startsAt).toLocaleString("en-US", { timeZone: "UTC" })}
                {" → "}
                {new Date(w.endsAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC
              </span>
              {w.label && (
                <span className={past ? "text-gray-700" : "text-gray-500"}>— {w.label}</span>
              )}
            </div>
            <button
              onClick={() => remove(w.id)}
              className="text-gray-600 hover:text-red-400 px-2 text-lg leading-none ml-4 shrink-0"
            >
              ✕
            </button>
          </div>
        );
      })}

      <form onSubmit={addWindow} className="border border-gray-800 rounded-md p-4 space-y-3 mt-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start (your local time)</label>
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End (your local time)</label>
            <input
              required
              type="datetime-local"
              value={form.endsAt}
              min={form.startsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Label (optional, e.g. planned deploy)"
            className={`${inputCls} flex-1`}
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {saving ? "..." : "Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
