"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!email.trim() || !password.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, role }),
    });
    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [...prev, user]);
      setEmail("");
      setPassword("");
      setRole("member");
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to create user");
    }
    setCreating(false);
  }

  async function handleRoleChange(id: string, newRole: "member" | "admin") {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    }
  }

  async function handleDelete(id: string, userEmail: string) {
    if (!confirm(`Delete user ${userEmail}?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Add User</p>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className={inputCls}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              className={`${inputCls} w-40`}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={creating || !email.trim() || !password.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">
          All Users <span className="text-gray-500 font-normal">({users.length})</span>
        </p>
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{u.email}</span>
                  {u.id === currentUserId && (
                    <span className="text-xs text-gray-500">(you)</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Joined {new Date(u.createdAt).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as "member" | "admin")}
                  disabled={u.id === currentUserId}
                  className="bg-gray-800 border border-gray-700 text-sm text-white rounded-md px-2 py-1 disabled:opacity-50 focus:outline-none focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
