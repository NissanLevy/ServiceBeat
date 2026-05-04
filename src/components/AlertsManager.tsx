"use client";

import { useState } from "react";

interface AlertRule {
  id: string;
  channel: string;
  config: Record<string, string>;
}

interface Props {
  monitorId: string;
  initialRules: AlertRule[];
}

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  slack: "Slack Webhook",
  webhook: "Webhook",
  pagerduty: "PagerDuty",
};

const CHANNEL_PLACEHOLDER: Record<string, string> = {
  email: "you@example.com",
  slack: "https://hooks.slack.com/services/...",
  webhook: "https://your-server.com/webhook",
  pagerduty: "Integration key (32 hex chars)",
};

const CHANNEL_FIELD: Record<string, string> = {
  email: "to",
  slack: "url",
  webhook: "url",
  pagerduty: "integrationKey",
};

export default function AlertsManager({ monitorId, initialRules }: Props) {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [channel, setChannel] = useState("email");
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      const configKey = CHANNEL_FIELD[channel];
      const res = await fetch(`/api/monitors/${monitorId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, config: { [configKey]: value.trim() } }),
      });
      const rule = await res.json();
      setRules((prev) => [...prev, rule]);
      setValue("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ruleId: string) {
    await fetch(`/api/monitors/${monitorId}/alerts/${ruleId}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {rules.length === 0 && !adding && (
          <p className="text-gray-500 text-sm">No alert rules configured.</p>
        )}
        {rules.map((rule) => {
          const configKey = CHANNEL_FIELD[rule.channel] ?? "url";
          const displayValue = rule.config[configKey] ?? Object.values(rule.config)[0];
          return (
            <div
              key={rule.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-md px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  {CHANNEL_LABELS[rule.channel] ?? rule.channel}
                </span>
                <span className="text-gray-300 truncate max-w-xs">{displayValue}</span>
              </div>
              <button
                onClick={() => handleDelete(rule.id)}
                className="text-gray-500 hover:text-red-400 text-xs"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="flex gap-2 items-start">
          <select
            value={channel}
            onChange={(e) => { setChannel(e.target.value); setValue(""); }}
            className={selectCls}
          >
            <option value="email">Email</option>
            <option value="slack">Slack Webhook</option>
            <option value="webhook">Webhook</option>
            <option value="pagerduty">PagerDuty</option>
          </select>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={CHANNEL_PLACEHOLDER[channel]}
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={handleAdd}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-2 rounded-md text-sm"
          >
            {saving ? "Adding..." : "Add"}
          </button>
          <button
            onClick={() => { setAdding(false); setValue(""); }}
            className="text-gray-400 hover:text-white px-2 py-2 text-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + Add alert rule
        </button>
      )}
    </div>
  );
}

const inputCls = "bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
const selectCls = "bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500";
