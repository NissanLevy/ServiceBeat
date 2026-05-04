"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });

    if (res.ok) {
      await signOut({ callbackUrl: "/login?passwordChanged=1" });
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to change password");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Account</label>
        <p className="text-sm text-white bg-gray-900 border border-gray-800 rounded-md px-3 py-2">
          {email}
        </p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Current password</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">New password</label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className={inputCls}
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-md text-sm font-medium"
      >
        {saving ? "Saving…" : "Change Password"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
