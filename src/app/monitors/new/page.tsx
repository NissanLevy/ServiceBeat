"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMonitorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    method: "GET",
    interval: 60,
    alertEmail: "",
    expectedStatus: 200,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          method: form.method,
          interval: form.interval,
          assertions: [{ type: "status_code", operator: "eq", value: form.expectedStatus }],
        }),
      });

      if (!res.ok) throw new Error("Failed to create monitor");
      const monitor = await res.json();

      if (form.alertEmail) {
        await fetch(`/api/monitors/${monitor.id}/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: "email", config: { to: form.alertEmail } }),
        });
      }

      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Monitor</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My API"
            className={inputCls}
          />
        </Field>

        <Field label="URL">
          <input
            required
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://api.example.com/health"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Method">
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className={inputCls}
            >
              {["GET", "POST", "PUT", "DELETE", "HEAD"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Interval (seconds)">
            <input
              type="number"
              min={10}
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Expected Status Code">
          <input
            type="number"
            value={form.expectedStatus}
            onChange={(e) => setForm({ ...form, expectedStatus: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>

        <Field label="Alert Email (optional)">
          <input
            type="email"
            value={form.alertEmail}
            onChange={(e) => setForm({ ...form, alertEmail: e.target.value })}
            placeholder="you@example.com"
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium"
          >
            {saving ? "Saving..." : "Create Monitor"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white px-4 py-2 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
