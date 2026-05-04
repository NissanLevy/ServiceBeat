export type AssertionOperator = "eq" | "neq" | "contains" | "gt" | "lt";

export type Assertion =
  | { type: "status_code";   operator: AssertionOperator;    value: number }
  | { type: "keyword";       operator: "contains" | "neq";  value: string }
  | { type: "jsonpath";      path: string; operator: AssertionOperator; value: unknown }
  | { type: "response_time"; operator: "gt" | "lt";          value: number };

export interface CheckInput {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  assertions: Assertion[];
}

export interface CheckOutput {
  passed: boolean;
  statusCode: number | null;
  responseTime: number;
  failureReason: string | null;
}
