export async function sendPagerDuty(
  integrationKey: string,
  action: "trigger" | "resolve",
  summary: string,
  source: string,
  dedupKey: string
) {
  const body =
    action === "resolve"
      ? { routing_key: integrationKey, event_action: "resolve", dedup_key: dedupKey }
      : {
          routing_key: integrationKey,
          event_action: "trigger",
          dedup_key: dedupKey,
          payload: {
            summary,
            source,
            severity: "critical",
            timestamp: new Date().toISOString(),
          },
        };

  const res = await fetch("https://events.pagerduty.com/v2/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PagerDuty error ${res.status}: ${text}`);
  }
}
