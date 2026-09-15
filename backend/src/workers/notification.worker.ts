import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import { sendSMS } from "../lib/sms";

export function startNotificationWorker() {
  const worker = new Worker(
    "notifications",
    async (job: Job) => {
      if (job.name === "notifyOfficial") await notifyOfficial(job.data);
      if (job.name === "notifyCitizen") await notifyCitizen(job.data);
      if (job.name === "slaWarning") await notifySLAWarning(job.data);
      if (job.name === "resolutionVerification") await notifyResolutionVerification(job.data);
    },
    { connection: getRedis(), concurrency: 10 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

async function notifyOfficial(data: { issueId: string; officialId: string }) {
  const { issueId, officialId } = data;

  const [issue, official] = await Promise.all([
    prisma.civicIssue.findUnique({
      where: { id: issueId },
      select: { title: true, category: true, priority: true, publicAreaLabel: true, department: true },
    }),
    prisma.official.findUnique({
      where: { id: officialId },
      select: { name: true, email: true },
    }),
  ]);

  if (!issue || !official) return;

  const subject = `[EcoConnect] New Civic Issue: ${issue.title}`;
  const body = `
Dear ${official.name},

A new civic issue has been assigned to your department (${issue.department}).

Title: ${issue.title}
Category: ${issue.category.replace(/_/g, " ")}
Priority: ${issue.priority}
Area: ${issue.publicAreaLabel}

Please log in to the EcoConnect official portal to review and respond.

This is an automated notification from EcoConnect.
  `.trim();

  await sendEmail({
    to: official.email,
    subject,
    text: body,
  });

  // Log accountability event
  await prisma.accountabilityEvent.create({
    data: {
      civicIssueId: issueId,
      type: "NOTIFIED_OFFICIAL",
      actorType: "SYSTEM",
      detail: { officialId, officialEmail: official.email },
    },
  });
}

async function notifyCitizen(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  civicIssueId?: string;
}) {
  const { userId, type, title, body, civicIssueId } = data;

  await prisma.notification.create({
    data: {
      userId,
      type: type as any,
      title,
      body,
      civicIssueId,
    },
  });
}

async function notifySLAWarning(data: {
  issueId: string;
  officialId: string;
  warningType: "WARNING_1" | "WARNING_2";
}) {
  const { issueId, officialId, warningType } = data;

  const [issue, official] = await Promise.all([
    prisma.civicIssue.findUnique({
      where: { id: issueId },
      select: { title: true, slaDeadline: true, priority: true },
    }),
    prisma.official.findUnique({
      where: { id: officialId },
      select: { name: true, email: true },
    }),
  ]);

  if (!issue || !official) return;

  const urgency = warningType === "WARNING_1" ? "Reminder" : "URGENT: Final Warning";
  const subject = `[EcoConnect] ${urgency} — Action Required on Civic Issue`;
  const deadline = issue.slaDeadline
    ? `Deadline: ${issue.slaDeadline.toLocaleString()}`
    : "Deadline approaching";

  const body = `
Dear ${official.name},

This is a ${warningType === "WARNING_1" ? "first reminder" : "FINAL WARNING"} for the civic issue assigned to you.

Issue: ${issue.title}
Priority: ${issue.priority}
${deadline}

Please take action immediately in the EcoConnect official portal.

If this issue is not resolved before the deadline, it will be escalated automatically.
  `.trim();

  await sendEmail({ to: official.email, subject, text: body });
}

async function notifyResolutionVerification(data: {
  userId: string;
  issueId: string;
}) {
  const { userId, issueId } = data;

  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: { title: true },
  });
  if (!issue) return;

  await prisma.notification.create({
    data: {
      userId,
      type: "RESOLUTION_VERIFICATION",
      title: "Is your issue resolved?",
      body: `The responsible authority has marked "${issue.title}" as resolved. Please confirm if the problem is actually fixed.`,
      civicIssueId: issueId,
    },
  });
}
