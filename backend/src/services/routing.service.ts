import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { getEnv } from "../lib/env";
import type { Department } from "@ecoconnect/types";

/**
 * Routes a civic issue to the responsible official based on:
 * 1. AI-identified department
 * 2. Jurisdiction match
 * 3. Load balancing (least loaded active official)
 */
export async function routeToAuthority(
  issueId: string,
  department: Department | string
): Promise<{ officialId: string } | null> {
  const env = getEnv();

  // Find the official for this department + jurisdiction with fewest active issues
  const official = await prisma.official.findFirst({
    where: {
      department: department as Department,
      jurisdiction: env.JURISDICTION_NAME,
      active: true,
    },
    orderBy: {
      issues: {
        _count: "asc",
      },
    },
  });

  if (!official) {
    console.warn(`[Routing] No active official for department ${department} in ${env.JURISDICTION_NAME}`);
    return null;
  }

  // Assign official to issue
  await prisma.civicIssue.update({
    where: { id: issueId },
    data: { assignedOfficialId: official.id },
  });

  // Log accountability event
  await prisma.accountabilityEvent.create({
    data: {
      civicIssueId: issueId,
      type: "ROUTED",
      actorType: "SYSTEM",
      detail: {
        department,
        officialId: official.id,
        officialName: official.name,
        jurisdiction: env.JURISDICTION_NAME,
      },
    },
  });

  return { officialId: official.id };
}

/**
 * Re-routes an issue when an official rejects it.
 * Tries the same department first (different official), then GENERAL.
 */
export async function rerouteOnRejection(
  issueId: string,
  rejectedOfficialId: string,
  reason: string
): Promise<{ officialId: string } | null> {
  const env = getEnv();
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: { department: true },
  });
  if (!issue) return null;

  // Try another official in the same department
  const alternative = await prisma.official.findFirst({
    where: {
      department: issue.department,
      jurisdiction: env.JURISDICTION_NAME,
      active: true,
      id: { not: rejectedOfficialId },
    },
    orderBy: { issues: { _count: "asc" } },
  });

  const assignedOfficial = alternative
    || await prisma.official.findFirst({
      where: {
        department: "GENERAL",
        jurisdiction: env.JURISDICTION_NAME,
        active: true,
      },
    });

  if (!assignedOfficial) return null;

  await prisma.civicIssue.update({
    where: { id: issueId },
    data: { assignedOfficialId: assignedOfficial.id },
  });

  await prisma.accountabilityEvent.create({
    data: {
      civicIssueId: issueId,
      type: "ROUTED",
      actorType: "SYSTEM",
      detail: {
        reroutedFrom: rejectedOfficialId,
        rejectionReason: reason,
        newOfficialId: assignedOfficial.id,
        department: assignedOfficial.department,
      },
    },
  });

  return { officialId: assignedOfficial.id };
}
