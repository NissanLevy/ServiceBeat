"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ monitorId }: { monitorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this monitor?")) return;
    setLoading(true);
    await fetch(`/api/monitors/${monitorId}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
