import { prisma } from "@/lib/prisma";
import { sendEmail } from "./email";

export async function dispatchAlerts(
  monitorId: string,
  type: "triggered" | "resolved",
  reason: string | null
) {
  const rules = await prisma.alertRule.findMany({ where: { monitorId } });

  for (const rule of rules) {
    const config = rule.config as Record<string, string>;

    if (rule.channel === "email" && config.to) {
      const subject =
        type === "triggered"
          ? `[ServiceBeat] Monitor DOWN`
          : `[ServiceBeat] Monitor RECOVERED`;

      const text =
        type === "triggered"
          ? `Your monitor (ID: ${monitorId}) failed.\n\nReason: ${reason}`
          : `Your monitor (ID: ${monitorId}) has recovered.`;

      await sendEmail(config.to, subject, text).catch(console.error);
    }

    await prisma.alertEvent.create({
      data: { ruleId: rule.id, monitorId, type },
    });
  }
}
