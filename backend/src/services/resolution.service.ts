import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { notificationQueue, verificationQueue } from "../workers/queues";
import type { VerifyResolutionDto } from "@ecoconnect/types";

const VERIFICATION_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Handles citizen resolution verification.
 * If confirmed → CLOSED. If rejected → AI reopen review.
 */
export async function verifyResolution(
  issueId: string,
  userId: string,
  dto: VerifyResolutionDto
): Promise<{ status: string }> {
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: {
      status: true,
      title: true,
      grievances: {
        where: { userId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!issue) {
    throw new AppError(404, "NOT_FOUND", "Issue not found.");
  }

  if (issue.status !== "AWAITING_VERIFICATION") {
    throw new AppError(409, "INVALID_STATE", "This issue is not awaiting verification.");
  }

  // Check if this user is a reporter of this issue
  if (!issue.grievances.length) {
    throw new AppError(403, "FORBIDDEN", "You are not a reporter of this issue.");
  }

  // Record verification
  await prisma.resolutionVerification.create({
    data: {
      civicIssueId: issueId,
      userId,
      confirmed: dto.confirmed,
      reason: dto.reason,
    },
  });

  if (dto.confirmed) {
    // Close the issue
    await prisma.$transaction([
      prisma.civicIssue.update({
        where: { id: issueId },
        data: { status: "CLOSED" },
      }),
      prisma.accountabilityEvent.create({
        data: {
          civicIssueId: issueId,
          type: "CONFIRMED_FIXED",
          actorType: "CITIZEN",
          actorId: userId,
          detail: { confirmed: true },
        },
      }),
    ]);

    // Issue coupon for verified resolution
    const grievance = issue.grievances[0];
    if (grievance) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.coupon.create({
        data: {
          userId,
          grievanceId: grievance.id,
          description: "Thank you for helping resolve a civic issue! Enjoy this reward.",
          expiresAt,
        },
      }).catch(() => {}); // Non-critical
    }

    return { status: "CLOSED" };
  } else {
    // Rejected — enqueue AI review for potential reopen
    await prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: "REJECTED_RESOLUTION",
        actorType: "CITIZEN",
        actorId: userId,
        detail: { reason: dto.reason },
      },
    });

    await verificationQueue.add("reviewReopen", {
      issueId,
      userId,
      citizenReason: dto.reason || "Citizen rejected resolution without explanation",
    }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });

    return { status: "UNDER_REVIEW" };
  }
}

/**
 * Transitions issue to AWAITING_VERIFICATION and starts the 48-hour window.
 * Called by official workflow when marking resolved.
 */
export async function startVerificationWindow(
  issueId: string,
  officialId: string,
  resolutionNote: string,
  evidenceUrls: string[]
): Promise<void> {
  const verificationDeadline = new Date(Date.now() + VERIFICATION_WINDOW_MS);

  await prisma.$transaction([
    prisma.civicIssue.update({
      where: { id: issueId },
      data: {
        status: "AWAITING_VERIFICATION",
        resolutionNote,
        resolutionEvidenceUrls: evidenceUrls,
        verificationDeadline,
      },
    }),
    prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: "RESOLVED",
        actorType: "OFFICIAL",
        actorId: officialId,
        detail: { resolutionNote, evidenceUrls },
      },
    }),
    prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: "VERIFICATION_SENT",
        actorType: "SYSTEM",
        detail: { deadline: verificationDeadline.toISOString() },
      },
    }),
  ]);

  // Notify reporters to verify
  const grievances = await prisma.grievance.findMany({
    where: { civicIssueId: issueId },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of grievances) {
    await notificationQueue.add("resolutionVerification", { userId, issueId }, {
      attempts: 3,
    });
  }

  // Schedule auto-close after 48h
  await verificationQueue.add(
    "autoClose",
    { issueId },
    { delay: VERIFICATION_WINDOW_MS, attempts: 3 }
  );
}
