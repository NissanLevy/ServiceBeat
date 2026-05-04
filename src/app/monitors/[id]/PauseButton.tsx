"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  monitorId: string;
  active: boolean;
}

export default function PauseButton({ monitorId, active }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/monitors/${monitorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
        active
          ? "text-yellow-400 border-yellow-400/30 hover:border-yellow-400/60"
          : "text-green-400 border-green-400/30 hover:border-green-400/60"
      }`}
    >
      {loading ? "..." : active ? "Pause" : "Resume"}
    </button>
  );
}
