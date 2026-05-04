"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AssertionBuilder from "@/components/AssertionBuilder";
import HeadersEditor, { type Header } from "@/components/HeadersEditor";
import type { Assertion } from "@/lib/checker/types";

interface Service { id: string; name: string; }

const BODY_METHODS = ["POST", "PUT", "PATCH"];

export default function EditMonitorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [form, setForm] = useState({
    name: "",
    url: "",
    method: "GET",
    interval: 60,
    failureThreshold: 1,
    serviceId: "",
    showOnStatusPage: true,
    body: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/monitors/${id}`).then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]).then(([monitor, svcs]) => {
      setForm({
        name: monitor.name,
        url: monitor.url,
        method: monitor.method,
        interval: monitor.interval,
        failureThreshold: monitor.failureThreshold ?? 1,
        serviceId: monitor.serviceId ?? "",
        showOnStatusPage: monitor.showOnStatusPage ?? true,
        body: typeof monitor.body === "string" ? monitor.body : monitor.body ? JSON.stringify(monitor.body, null, 2) : "",
      });
      setAssertions(monitor.assertions ?? []);
      setHeaders(Object.entries(monitor.headers ?? {}).map(([key, value]) => ({ key, value: String(value) })));
      setServices(svcs);
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const headersObj = Object.fromEntries(
        headers.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value])
      );
      await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          method: form.method,
          interval: form.interval,
          failureThreshold: form.failureThreshold,
          serviceId: form.serviceId || null,
          showOnStatusPage: form.showOnStatusPage,
          headers: headersObj,
          body: BODY_METHODS.includes(form.method) && form.body.trim() ? form.body : null,
          assertions,
        }),
      });
      router.push(`/monitors/${id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-white">← Back</button>
        <h1 className="text-2xl font-bold mt-1">Edit Monitor</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Service (optional)">
          <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className={inputCls}>
            <option value="">No service / ungrouped</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Name">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </Field>

        <Field label="URL">
          <input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Method">
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputCls}>
              {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Interval (seconds)">
            <input type="number" min={10} value={form.interval} onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })} className={inputCls} />
          </Field>
        </div>

        <Field label="Request Headers (optional)">
          <HeadersEditor headers={headers} onChange={setHeaders} />
        </Field>

        {BODY_METHODS.includes(form.method) && (
          <Field label="Request Body (optional)">
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder='{"key": "value"}'
              rows={3}
              className={`${inputCls} font-mono`}
            />
          </Field>
        )}

        <Field label="Assertions">
          <AssertionBuilder assertions={assertions} onChange={setAssertions} />
        </Field>

        <Field label="Alert after N consecutive failures">
          <input
            type="number"
            min={1}
            max={10}
            value={form.failureThreshold}
            onChange={(e) => setForm({ ...form, failureThreshold: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={form.showOnStatusPage} onChange={(e) => setForm({ ...form, showOnStatusPage: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-0" />
          <span className="text-sm text-gray-300">Show on public status page</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()} className="text-gray-400 hover:text-white px-4 py-2 rounded-md text-sm">Cancel</button>
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

const inputCls = "w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
