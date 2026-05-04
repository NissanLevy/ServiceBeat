import { prisma } from "@/lib/prisma";
import { sendEmail } from "./email";
import { sendSlack } from "./slack";
import { sendWebhook } from "./webhook";
import { sendPagerDuty } from "./pagerduty";

export async function dispatchAlerts(
  monitorId: string,
  type: "triggered" | "resolved",
  reason: string | null
) {
  const [rules, monitor] = await Promise.all([
    prisma.alertRule.findMany({ where: { monitorId } }),
    prisma.monitor.findUnique({ where: { id: monitorId }, select: { name: true, url: true } }),
  ]);

  const monitorName = monitor?.name ?? monitorId;
  const monitorUrl = monitor?.url ?? "";
  const emoji = type === "triggered" ? "🔴" : "🟢";
  const status = type === "triggered" ? "DOWN" : "RECOVERED";

  for (const rule of rules) {
    const config = rule.config as Record<string, string>;

    try {
      if (rule.channel === "email" && config.to) {
        await sendEmail(
          config.to,
          `[ServiceBeat] ${monitorName} is ${status}`,
          type === "triggered"
            ? `Monitor "${monitorName}" (${monitorUrl}) is DOWN.\n\nReason: ${reason}`
            : `Monitor "${monitorName}" (${monitorUrl}) has RECOVERED.`
        );
      }

      if (rule.channel === "slack" && config.url) {
        await sendSlack(
          config.url,
          `${emoji} *${monitorName}* is *${status}*${type === "triggered" ? `\n> ${reason}` : ""}`
        );
      }

      if (rule.channel === "webhook" && config.url) {
        await sendWebhook(config.url, {
          monitor: { id: monitorId, name: monitorName, url: monitorUrl },
          type,
          reason,
          timestamp: new Date().toISOString(),
        });
      }

      if (rule.channel === "pagerduty" && config.integrationKey) {
        await sendPagerDuty(
          config.integrationKey,
          type === "triggered" ? "trigger" : "resolve",
          `${monitorName} is DOWN${reason ? `: ${reason.split("\n")[0]}` : ""}`,
          monitorUrl,
          monitorId
        );
      }

      await prisma.alertEvent.create({
        data: { ruleId: rule.id, monitorId, type },
      });
    } catch (err) {
      console.error(`Alert failed [${rule.channel}] monitor ${monitorId}:`, err);
    }
  }
}
