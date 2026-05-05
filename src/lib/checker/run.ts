import axios from "axios";
import https from "https";
import tls from "tls";
import { JSONPath } from "jsonpath-plus";
import type { Assertion, CheckInput, CheckOutput } from "./types";

function compare(operator: string, actual: unknown, expected: unknown): boolean {
  switch (operator) {
    case "eq":       return actual == expected;
    case "neq":      return actual != expected;
    case "contains": return String(actual).includes(String(expected));
    case "gt":       return Number(actual) > Number(expected);
    case "lt":       return Number(actual) < Number(expected);
    default:         return false;
  }
}

function getSslDaysRemaining(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return resolve(null);
      const req = https.request(
        { host: parsed.hostname, port: Number(parsed.port) || 443, method: "HEAD", rejectUnauthorized: false },
        (res) => {
          const cert = (res.socket as tls.TLSSocket).getPeerCertificate();
          req.destroy();
          if (cert?.valid_to) {
            resolve(Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000));
          } else {
            resolve(null);
          }
        }
      );
      req.on("error", () => resolve(null));
      req.end();
    } catch {
      resolve(null);
    }
  });
}

function evaluate(
  assertion: Assertion,
  statusCode: number,
  body: string,
  parsed: unknown,
  responseTime: number,
  sslDaysRemaining: number | null
): string | null {
  if (assertion.type === "status_code") {
    if (!compare(assertion.operator, statusCode, assertion.value))
      return `Status code ${statusCode} failed: expected ${assertion.operator} ${assertion.value}`;
    return null;
  }

  if (assertion.type === "keyword") {
    if (!compare(assertion.operator, body, assertion.value))
      return assertion.operator === "contains"
        ? `Response body does not contain "${assertion.value}" (body length: ${body.length} chars)`
        : `Response body contains "${assertion.value}" but should not`;
    return null;
  }

  if (assertion.type === "jsonpath") {
    if (!parsed) return `JSONPath assertion requires a JSON response body`;
    const results = JSONPath({ path: assertion.path, json: parsed as object });
    if (!results || results.length === 0)
      return `JSONPath "${assertion.path}" returned no match`;
    const actual = results[0];
    if (!compare(assertion.operator, actual, assertion.value)) {
      const typeMismatch = typeof actual !== typeof assertion.value
        ? ` (type mismatch: got ${typeof actual}, expected ${typeof assertion.value})`
        : "";
      return `JSONPath "${assertion.path}" = ${JSON.stringify(actual)} failed: expected ${assertion.operator} ${JSON.stringify(assertion.value)}${typeMismatch}`;
    }
    return null;
  }

  if (assertion.type === "response_time") {
    if (!compare(assertion.operator, responseTime, assertion.value))
      return `Response time ${responseTime}ms failed: expected ${assertion.operator === "lt" ? "less than" : "greater than"} ${assertion.value}ms`;
    return null;
  }

  if (assertion.type === "ssl_expiry") {
    if (sslDaysRemaining === null) return `Could not retrieve SSL certificate`;
    if (sslDaysRemaining < 0) return `SSL certificate has expired`;
    if (sslDaysRemaining < assertion.value)
      return `SSL certificate expires in ${sslDaysRemaining} day(s) (threshold: ${assertion.value} days)`;
    return null;
  }

  return null;
}

export async function runCheck(input: CheckInput): Promise<CheckOutput> {
  const start = Date.now();

  try {
    let requestData = input.body;
    const extraHeaders: Record<string, string> = {};
    if (typeof input.body === "string" && input.body.trim()) {
      try {
        requestData = JSON.parse(input.body);
        extraHeaders["Content-Type"] = "application/json";
      } catch {
        // not JSON, send as plain text
      }
    }

    const [response, sslDaysRemaining] = await Promise.all([
      axios.request({
        url: input.url,
        method: input.method,
        headers: { ...extraHeaders, ...(input.headers ?? {}) },
        data: requestData,
        validateStatus: () => true,
        timeout: 10000,
      }),
      input.assertions.some((a) => a.type === "ssl_expiry")
        ? getSslDaysRemaining(input.url)
        : Promise.resolve(null),
    ]);

    const responseTime = Date.now() - start;
    const body = typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data);
    const parsed = typeof response.data === "object" ? response.data : (() => {
      try { return JSON.parse(body); } catch { return null; }
    })();

    const failures = input.assertions
      .map((a) => evaluate(a, response.status, body, parsed, responseTime, sslDaysRemaining))
      .filter((f): f is string => f !== null);

    if (failures.length > 0) {
      return { passed: false, statusCode: response.status, responseTime, failureReason: failures.join("\n") };
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
