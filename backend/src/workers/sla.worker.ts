import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { notificationQueue } from "./queues";
import { computePriority } from "../services/priority.service";

// SLA config in hours
const SLA_CONFIG = {
  CRITICAL: 24,
  HIGH: 48,
  MEDIUM: 240,   // 10 days
  LOW: 240,
  NEGLIGIBLE: 240,
} as const;

export function startSLAWorker() {
  const worker = new Worker(
    "sla",
    async (job: Job) => {
      if (job.name === "startSLA") await startSLA(job.data);
      if (job.name === "checkSLA") await checkSLA(job.data.issueId);
    },
    { connection: getRedis(), concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[SLAWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

async function startSLA(data: { issueId: string; severity: string }) {
  const { issueId, severity } = data;
  const slaHours = SLA_CONFIG[severity as keyof typeof SLA_CONFIG] ?? SLA_CONFIG.MEDIUM;
  const startedAt = new Date();
  const deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
  const slaType = slaHours <= 48 ? "SERIOUS_24H" : "STANDARD_10D";

  await prisma.sLARecord.upsert({
    where: { civicIssueId: issueId },
    create: {
      civicIssueId: issueId,
      slaType,
      startedAt,
      deadline,
    },
    update: { deadline, slaType },
  });

  await prisma.civicIssue.update({
    where: { id: issueId },
    data: { slaDeadline: deadline },
  });

  // Schedule check at 50% of SLA window (Warning #1)
  const warning1Delay = slaHours * 60 * 60 * 1000 * 0.5;
  await (await import("./queues")).slaQueue.add(
    "checkSLA",
    { issueId, stage: "WARNING_1" },
    { delay: warning1Delay }
  );

  console.log(`[SLA] Started for issue ${issueId}: ${slaHours}h deadline`);
}

async function checkSLA(issueId: string) {
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: { status: true, slaRecord: true, assignedOfficialId: true },
  });

  if (!issue || !issue.slaRecord) return;
  if (["CLOSED", "AUTO_CLOSED", "RESOLVED"].includes(issue.status)) {
    // Issue resolved — SLA complete
    await prisma.sLARecord.update({
      where: { civicIssueId: issueId },
      data: { resolvedAt: new Date() },
    });
    return;
  }

  const sla = issue.slaRecord;
  const now = new Date();
  const totalDuration = sla.deadline.getTime() - sla.startedAt.getTime();
  const elapsed = now.getTime() - sla.startedAt.getTime();
  const progressPct = elapsed / totalDuration;

  // Warning #1 (50% elapsed)
  if (!sla.warning1SentAt && progressPct >= 0.5) {
    await sendSLAWarning(issueId, "WARNING_1", sla.civicIssueId, issue.assignedOfficialId);
    await prisma.sLARecord.update({
      where: { civicIssueId: issueId },
      data: { warning1SentAt: now },
    });

    // Schedule Warning #2 check (75% elapsed)
    const remainingMs = sla.deadline.getTime() - now.getTime();
    const warn2Delay = remainingMs * 0.5;
    await (await import("./queues")).slaQueue.add(
      "checkSLA",
      { issueId, stage: "WARNING_2" },
      { delay: warn2Delay }
    );
    return;
  }

  // Warning #2 (75% elapsed)
  if (sla.warning1SentAt && !sla.warning2SentAt && progressPct >= 0.75) {
    await sendSLAWarning(issueId, "WARNING_2", sla.civicIssueId, issue.assignedOfficialId);
    await prisma.sLARecord.update({
      where: { civicIssueId: issueId },
      data: { warning2SentAt: now, gracePeriodAt: now },
    });

    // Schedule escalation at deadline
    const escalateDelay = sla.deadline.getTime() - now.getTime();
    await (await import("./queues")).slaQueue.add(
      "checkSLA",
      { issueId, stage: "ESCALATE" },
      { delay: Math.max(escalateDelay, 0) }
    );
    return;
  }

  // Escalation (past deadline)
  if (sla.warning2SentAt && !sla.escalatedAt && now >= sla.deadline) {
    await escalateIssue(issueId, sla.civicIssueId, issue.assignedOfficialId);
    await prisma.sLARecord.update({
      where: { civicIssueId: issueId },
      data: { escalatedAt: now },
    });
  }
}

async function sendSLAWarning(
  issueId: string,
  warningType: "WARNING_1" | "WARNING_2",
  _civicIssueId: string,
  officialId: string | null
) {
  const eventType = warningType === "WARNING_1" ? "SLA_WARNING_1" : "SLA_WARNING_2";

  await prisma.accountabilityEvent.create({
    data: {
      civicIssueId: issueId,
      type: eventType,
      actorType: "SYSTEM",
      detail: { warningType, timestamp: new Date().toISOString() },
    },
  });

  if (officialId) {
    await notificationQueue.add("slaWarning", { issueId, officialId, warningType }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
  }
}

async function escalateIssue(
  issueId: string,
  _civicIssueId: string,
  officialId: string | null
) {
  await prisma.$transaction([
    prisma.civicIssue.update({
      where: { id: issueId },
      data: { status: "ESCALATED" },
    }),
    prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: "ESCALATED",
        actorType: "SYSTEM",
        detail: {
          message: "Issue escalated due to SLA breach.",
          timestamp: new Date().toISOString(),
        },
      },
    }),
  ]);

  // Re-compute priority (time-unresolved factor)
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    include: { grievances: { include: { aiAnalysis: true }, take: 1, orderBy: { createdAt: "desc" } } },
  });

  console.log(`[SLA] Issue ${issueId} ESCALATED after SLA breach`);
}
