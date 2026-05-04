"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AssertionBuilder from "@/components/AssertionBuilder";
import type { Assertion } from "@/lib/checker/types";

interface Service { id: string; name: string; }

export default function NewMonitorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [showNewService, setShowNewService] = useState(false);
  const [assertions, setAssertions] = useState<Assertion[]>([
    { type: "status_code", operator: "eq", value: 200 },
  ]);
  const [form, setForm] = useState({
    name: "",
    url: "",
    method: "GET",
    interval: 60,
    alertEmail: "",
    serviceId: "",
  });

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  async function createService() {
    if (!newServiceName.trim()) return;
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newServiceName.trim() }),
    });
    const service = await res.json();
    setServices((prev) => [...prev, service].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, serviceId: service.id }));
    setNewServiceName("");
    setShowNewService(false);
  }

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
          serviceId: form.serviceId || null,
          assertions,
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

        <Field label="Service (optional)">
          <div className="space-y-2">
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className={inputCls}
            >
              <option value="">No service / ungrouped</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {!showNewService ? (
              <button
                type="button"
                onClick={() => setShowNewService(true)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Create new service
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createService())}
                  placeholder="Service name"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={createService}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-md text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewService(false)}
                  className="text-gray-400 hover:text-white px-2 py-2 text-sm"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </Field>

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

        <Field label="Assertions">
          <AssertionBuilder assertions={assertions} onChange={setAssertions} />
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
