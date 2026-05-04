"use client";

export interface Header { key: string; value: string; }

interface Props {
  headers: Header[];
  onChange: (headers: Header[]) => void;
}

export default function HeadersEditor({ headers, onChange }: Props) {
  function update(i: number, field: "key" | "value", val: string) {
    onChange(headers.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  }

  return (
    <div className="space-y-2">
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={h.key}
            onChange={(e) => update(i, "key", e.target.value)}
            placeholder="Header name"
            className={`${inputCls} flex-1`}
          />
          <input
            value={h.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder="Value"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => onChange(headers.filter((_, idx) => idx !== i))}
            className="text-gray-500 hover:text-red-400 px-2 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...headers, { key: "", value: "" }])}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        + Add header
      </button>
    </div>
  );
}

const inputCls = "bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
