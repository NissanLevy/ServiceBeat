import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { runCheck } from "../lib/checker/run";
import { dispatchAlerts } from "../lib/alerts/dispatch";
import { scheduleMonitor } from "../lib/queue/jobs";
import type { Assertion } from "../lib/checker/types";

const prisma = new PrismaClient();
const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

async function syncSchedules() {
  const monitors = await prisma.monitor.findMany({ where: { active: true } });
  await Promise.all(monitors.map((m) => scheduleMonitor(m.id, m.interval)));
  console.log(`Scheduled ${monitors.length} active monitor(s)`);
}

const worker = new Worker(
  "monitors",
  async (job) => {
    const { monitorId } = job.data as { monitorId: string };

    const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
    if (!monitor || !monitor.active) return;

    const result = await runCheck({
      url: monitor.url,
      method: monitor.method,
      headers: (monitor.headers as Record<string, string>) ?? {},
      body: monitor.body,
      assertions: (monitor.assertions as Assertion[]) ?? [],
    });

    await prisma.checkResult.create({
      data: {
        monitorId,
        passed: result.passed,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        failureReason: result.failureReason,
      },
    });

    // Find last check to detect state change
    const previous = await prisma.checkResult.findFirst({
      where: { monitorId },
      orderBy: { timestamp: "desc" },
      skip: 1,
    });

    const stateChanged = !previous || previous.passed !== result.passed;

    if (stateChanged) {
      await dispatchAlerts(
        monitorId,
        result.passed ? "resolved" : "triggered",
        result.failureReason
      );
    }
  },
  { connection, concurrency: 10 }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("ServiceBeat worker started");
syncSchedules().catch(console.error);
