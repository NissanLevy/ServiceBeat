import axios from "axios";
import { JSONPath } from "jsonpath-plus";
import type { Assertion, CheckInput, CheckOutput } from "./types";

function compare(operator: string, actual: unknown, expected: unknown): boolean {
  switch (operator) {
    case "eq":      return actual == expected;
    case "neq":     return actual != expected;
    case "contains": return String(actual).includes(String(expected));
    case "gt":      return Number(actual) > Number(expected);
    case "lt":      return Number(actual) < Number(expected);
    default:        return false;
  }
}

function evaluate(assertion: Assertion, statusCode: number, body: string, parsed: unknown): string | null {
  if (assertion.type === "status_code") {
    if (!compare(assertion.operator, statusCode, assertion.value))
      return `Status code ${statusCode} failed: expected ${assertion.operator} ${assertion.value}`;
    return null;
  }

  if (assertion.type === "keyword") {
    if (!compare(assertion.operator, body, assertion.value))
      return assertion.operator === "contains"
        ? `Response body does not contain "${assertion.value}"`
        : `Response body should not contain "${assertion.value}"`;
    return null;
  }

  if (assertion.type === "jsonpath") {
    if (!parsed) return `JSONPath assertion requires a JSON response body`;
    const results = JSONPath({ path: assertion.path, json: parsed as object });
    if (!results || results.length === 0)
      return `JSONPath "${assertion.path}" returned no match`;
    const actual = results[0];
    if (!compare(assertion.operator, actual, assertion.value))
      return `JSONPath "${assertion.path}" = ${JSON.stringify(actual)} failed: expected ${assertion.operator} ${JSON.stringify(assertion.value)}`;
    return null;
  }

  return null;
}

export async function runCheck(input: CheckInput): Promise<CheckOutput> {
  const start = Date.now();

  try {
    const response = await axios.request({
      url: input.url,
      method: input.method,
      headers: input.headers ?? {},
      data: input.body,
      validateStatus: () => true,
      timeout: 10000,
    });

    const responseTime = Date.now() - start;
    const body = typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data);
    const parsed = typeof response.data === "object" ? response.data : (() => {
      try { return JSON.parse(body); } catch { return null; }
    })();

    for (const assertion of input.assertions) {
      const failure = evaluate(assertion, response.status, body, parsed);
      if (failure) {
        return { passed: false, statusCode: response.status, responseTime, failureReason: failure };
      }
    }

    return { passed: true, statusCode: response.status, responseTime, failureReason: null };
  } catch (err) {
    return {
      passed: false,
      statusCode: null,
      responseTime: Date.now() - start,
      failureReason: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
