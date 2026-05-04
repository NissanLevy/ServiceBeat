export async function sendWebhook(url: string, payload: Record<string, unknown>) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
