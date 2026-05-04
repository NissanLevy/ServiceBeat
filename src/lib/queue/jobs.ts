import { Queue } from "bullmq";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

let _queue: Queue | null = null;

function getQueue() {
  if (!_queue) _queue = new Queue("monitors", { connection });
  return _queue;
}

export async function scheduleMonitor(monitorId: string, intervalSeconds: number) {
  await getQueue().add(
    "check",
    { monitorId },
    {
      jobId: `monitor-${monitorId}`,
      repeat: { every: intervalSeconds * 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );
}

export async function removeMonitor(monitorId: string) {
  const repeatableJobs = await getQueue().getRepeatableJobs();
  const job = repeatableJobs.find((j) => j.key.includes(`monitor-${monitorId}`));
  if (job) await getQueue().removeRepeatableByKey(job.key);
}

export async function scheduleCleanup() {
  await getQueue().add(
    "cleanup",
    {},
    {
      jobId: "cleanup",
      repeat: { every: 24 * 60 * 60 * 1000 },
      removeOnComplete: { count: 1 },
      removeOnFail: { count: 1 },
    }
  );
}
