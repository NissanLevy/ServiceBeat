"use client";

import { useState, useEffect, type FormEvent } from "react";

interface Token {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/tokens").then((r) => r.json()).then(setTokens);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      setTokens((prev) => [data, ...prev]);
      setNewToken(data.rawToken);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  async function copy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/" className="text-sm text-gray-400 hover:text-white">← Back</a>
        <h1 className="text-2xl font-bold mt-1">API Tokens</h1>
        <p className="text-sm text-gray-400 mt-1">
          Use tokens to access the API without a browser session.
        </p>
      </div>

      {newToken && (
        <div className="bg-green-950/40 border border-green-700/50 rounded-lg px-5 py-4 mb-6">
          <p className="text-sm text-green-400 font-medium mb-2">
            Token created — copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-green-300 font-mono break-all">
              {newToken}
            </code>
            <button
              onClick={copy}
              className="shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-sm text-white px-3 py-2 rounded-md"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use as: <code className="text-gray-400">Authorization: Bearer {newToken.slice(0, 16)}…</code>
          </p>
          <button
            onClick={() => setNewToken(null)}
            className="text-xs text-gray-500 hover:text-gray-300 mt-3 block"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g. CI pipeline)"
          className={`${inputCls} flex-1`}
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {saving ? "Creating…" : "Create token"}
        </button>
      </form>

      <div className="space-y-2">
        {tokens.length === 0 && (
          <p className="text-gray-500 text-sm">No tokens yet.</p>
        )}
        {tokens.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4"
          >
            <div>
              <p className="text-sm font-medium text-white">{t.name}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{t.prefix}…</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Created {new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                {t.lastUsedAt && (
                  <> · Last used {new Date(t.lastUsedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</>
                )}
              </p>
            </div>
            <button
              onClick={() => handleRevoke(t.id)}
              className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-400/40 px-3 py-1.5 rounded-md transition-colors"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-gray-800 rounded-lg px-5 py-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Usage</p>
        <div className="space-y-3 text-xs text-gray-400 font-mono">
          <div>
            <p className="text-gray-500 mb-1 font-sans">List monitors</p>
            <code className="block bg-gray-950 rounded px-3 py-2">
              GET /api/monitors<br />
              Authorization: Bearer sb_…
            </code>
          </div>
          <div>
            <p className="text-gray-500 mb-1 font-sans">Get monitor + latest check</p>
            <code className="block bg-gray-950 rounded px-3 py-2">
              GET /api/monitors/:id<br />
              Authorization: Bearer sb_…
            </code>
          </div>
          <div>
            <p className="text-gray-500 mb-1 font-sans">Create a monitor</p>
            <code className="block bg-gray-950 rounded px-3 py-2 whitespace-pre">{`POST /api/monitors
Authorization: Bearer sb_…
Content-Type: application/json

{ "name": "My API", "url": "https://…", "method": "GET" }`}</code>
          </div>
          <div>
            <p className="text-gray-500 mb-1 font-sans">Pause / resume</p>
            <code className="block bg-gray-950 rounded px-3 py-2">{`PATCH /api/monitors/:id
Authorization: Bearer sb_…\n\n{ "active": false }`}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
