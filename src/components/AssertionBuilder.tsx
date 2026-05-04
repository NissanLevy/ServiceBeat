"use client";

import type { Assertion, AssertionOperator } from "@/lib/checker/types";

interface Props {
  assertions: Assertion[];
  onChange: (assertions: Assertion[]) => void;
}

const STATUS_CODE_OPS: AssertionOperator[] = ["eq", "neq", "gt", "lt"];
const KEYWORD_OPS = ["contains", "neq"] as const;
const JSONPATH_OPS: AssertionOperator[] = ["eq", "neq", "contains", "gt", "lt"];
const RESPONSE_TIME_OPS = ["gt", "lt"] as const;

const OP_LABELS: Record<string, string> = {
  eq: "equals",
  neq: "not equals",
  contains: "contains",
  gt: "greater than",
  lt: "less than",
};

function defaultAssertion(type: Assertion["type"]): Assertion {
  if (type === "status_code")   return { type, operator: "eq", value: 200 };
  if (type === "keyword")       return { type, operator: "contains", value: "" };
  if (type === "response_time") return { type, operator: "lt", value: 3000 };
  return { type: "jsonpath", path: "$.status", operator: "eq", value: "" };
}

export default function AssertionBuilder({ assertions, onChange }: Props) {
  function update(index: number, partial: Partial<Assertion>) {
    const next = assertions.map((a, i) => i === index ? { ...a, ...partial } as Assertion : a);
    onChange(next);
  }

  function changeType(index: number, type: Assertion["type"]) {
    const next = assertions.map((a, i) => i === index ? defaultAssertion(type) : a);
    onChange(next);
  }

  function remove(index: number) {
    onChange(assertions.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...assertions, defaultAssertion("status_code")]);
  }

  return (
    <div className="space-y-3">
      {assertions.map((assertion, i) => (
        <div key={i} className="flex gap-2 items-start">
          {/* Type */}
          <select
            value={assertion.type}
            onChange={(e) => changeType(i, e.target.value as Assertion["type"])}
            className={selectCls}
          >
            <option value="status_code">Status Code</option>
            <option value="keyword">Keyword</option>
            <option value="jsonpath">JSONPath</option>
            <option value="response_time">Response Time (ms)</option>
          </select>

          {/* JSONPath path input */}
          {assertion.type === "jsonpath" && (
            <input
              value={assertion.path}
              onChange={(e) => update(i, { path: e.target.value } as Partial<Assertion>)}
              placeholder="$.data.status"
              className={`${inputCls} w-36`}
            />
          )}

          {/* Operator */}
          <select
            value={assertion.operator}
            onChange={(e) => update(i, { operator: e.target.value as AssertionOperator })}
            className={selectCls}
          >
            {(assertion.type === "status_code" ? STATUS_CODE_OPS
              : assertion.type === "keyword" ? KEYWORD_OPS
              : assertion.type === "response_time" ? RESPONSE_TIME_OPS
              : JSONPATH_OPS
            ).map((op) => (
              <option key={op} value={op}>{OP_LABELS[op]}</option>
            ))}
          </select>

          {/* Value */}
          <input
            value={String(assertion.value)}
            onChange={(e) => {
              const raw = e.target.value;
              const value = (assertion.type === "status_code" || assertion.type === "response_time")
                ? Number(raw)
                : raw;
              update(i, { value } as Partial<Assertion>);
            }}
            placeholder={assertion.type === "status_code" ? "200" : assertion.type === "response_time" ? "3000" : assertion.type === "jsonpath" ? "active" : "keyword"}
            className={`${inputCls} flex-1`}
          />

          <button
            type="button"
            onClick={() => remove(i)}
            disabled={assertions.length === 1}
            className="text-gray-500 hover:text-red-400 disabled:opacity-30 px-1 py-2 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        + Add assertion
      </button>
    </div>
  );
}

const inputCls = "bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";
const selectCls = "bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500";
