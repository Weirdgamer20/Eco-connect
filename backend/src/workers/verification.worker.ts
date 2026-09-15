import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { notificationQueue } from "./queues";
import { reviewReopenRequest } from "../lib/gemini";

export function startVerificationWorker() {
  const worker = new Worker(
    "verification",
    async (job: Job) => {
      if (job.name === "autoClose") await handleAutoClose(job.data.issueId);
      if (job.name === "reviewReopen") await handleReopenReview(job.data);
    },
    { connection: getRedis(), concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[VerificationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

async function handleAutoClose(issueId: string) {
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: { status: true },
  });

  if (!issue || issue.status !== "AWAITING_VERIFICATION") {
    // Issue was already confirmed or reopened — don't auto-close
    return;
  }

  // Auto-close (no citizen response within 48h)
  await prisma.$transaction([
    prisma.civicIssue.update({
      where: { id: issueId },
      data: { status: "AUTO_CLOSED" },
    }),
    prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: "AUTO_CLOSED",
        actorType: "SYSTEM",
        detail: {
          reason: "No citizen response within 48-hour verification window",
          timestamp: new Date().toISOString(),
        },
      },
    }),
  ]);

  console.log(`[VerificationWorker] Issue ${issueId} auto-closed after 48h timeout`);
}

async function handleReopenReview(data: {
  issueId: string;
  userId: string;
  citizenReason: string;
}) {
  const { issueId, userId, citizenReason } = data;

  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: {
      title: true,
      resolutionNote: true,
      upvoteCount: true,
      downvoteCount: true,
    },
  });

  if (!issue) return;

  const review = await reviewReopenRequest(
    issue.title,
    issue.resolutionNote || "No resolution note provided",
    citizenReason,
    { upvotes: issue.upvoteCount, downvotes: issue.downvoteCount }
  );

  if (review.shouldReopen) {
    await prisma.$transaction([
      prisma.civicIssue.update({
        where: { id: issueId },
        data: { status: "REOPENED" },
      }),
      prisma.accountabilityEvent.create({
        data: {
          civicIssueId: issueId,
          type: "REOPENED",
          actorType: "SYSTEM",
          detail: {
            aiRationale: review.rationale,
            confidence: review.confidence,
            citizenReason,
          },
        },
      }),
    ]);

    // Notify original reporter
    await notificationQueue.add("notifyCitizen", {
      userId,
      type: "YOUR_GRIEVANCE",
      title: "Issue Reopened",
      body: "Based on your feedback and community signals, this issue has been reopened for further action.",
      civicIssueId: issueId,
    });
  } else {
    // Keep closed
    await prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: "CONFIRMED_FIXED",
        actorType: "SYSTEM",
        detail: {
          aiRationale: review.rationale,
          confidence: review.confidence,
        },
      },
    });
  }
}
