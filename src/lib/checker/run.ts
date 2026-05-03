import axios from "axios";
import type { Assertion, CheckInput, CheckOutput } from "./types";

function evaluate(assertion: Assertion, statusCode: number, body: string): string | null {
  if (assertion.type === "status_code") {
    const actual = statusCode;
    const expected = assertion.value;
    if (assertion.operator === "eq" && actual !== expected)
      return `Status code ${actual} !== ${expected}`;
    if (assertion.operator === "neq" && actual === expected)
      return `Status code ${actual} should not be ${expected}`;
    if (assertion.operator === "gt" && actual <= expected)
      return `Status code ${actual} is not > ${expected}`;
    if (assertion.operator === "lt" && actual >= expected)
      return `Status code ${actual} is not < ${expected}`;
    return null;
  }

  if (assertion.type === "keyword") {
    const contains = body.includes(String(assertion.value));
    if (assertion.operator === "contains" && !contains)
      return `Response body does not contain "${assertion.value}"`;
    if (assertion.operator === "neq" && contains)
      return `Response body should not contain "${assertion.value}"`;
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

    // Phase A: only status_code and keyword assertions
    for (const assertion of input.assertions) {
      const failure = evaluate(assertion, response.status, body);
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
