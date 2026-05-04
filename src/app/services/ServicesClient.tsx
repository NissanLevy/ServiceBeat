"use client";

import { useState } from "react";

interface Service {
  id: string;
  name: string;
  _count: { monitors: number };
}

export default function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const service = await res.json();
    setServices((prev) =>
      [...prev, { ...service, _count: { monitors: 0 } }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setNewName("");
    setSaving(false);
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    setServices((prev) =>
      prev
        .map((s) => (s.id === id ? { ...s, name: editingName.trim() } : s))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingId(null);
  }

  async function handleDelete(id: string, monitorCount: number) {
    if (monitorCount > 0) {
      if (!confirm(`This service has ${monitorCount} monitor(s). They will become ungrouped. Continue?`)) return;
    } else {
      if (!confirm("Delete this service?")) return;
    }
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditingName(service.name);
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Create new service */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">New Service</p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Auth API"
            className={inputCls}
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create
          </button>
        </div>
      </div>

      {/* Service list */}
      <div className="space-y-2">
        {services.length === 0 && (
          <p className="text-gray-500 text-sm">No services yet.</p>
        )}
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
          >
            {editingId === service.id ? (
              <div className="flex items-center gap-2 flex-1 mr-3">
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(service.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={() => handleRename(service.id)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-sm text-gray-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-medium text-white">{service.name}</span>
                <span className="text-xs text-gray-500">
                  {service._count.monitors} monitor{service._count.monitors !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {editingId !== service.id && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startEdit(service)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(service.id, service._count.monitors)}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
