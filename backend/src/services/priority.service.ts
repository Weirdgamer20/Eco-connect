import { prisma } from "../lib/prisma";
import type { AIAnalysisResult } from "@ecoconnect/types";

const RULE_ENGINE_VERSION = "v1.0";

// Priority scoring weights
const WEIGHTS = {
  safety: 0.35,
  environmental: 0.20,
  peopleAffected: 0.15,
  geographicSpread: 0.10,
  severity: 0.20,
};

// Severity → score mapping
const SEVERITY_SCORE: Record<string, number> = {
  CRITICAL: 1.0,
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
  NEGLIGIBLE: 0.1,
};

/**
 * Computes priority for a civic issue based on AI analysis + government rules.
 * Creates a deterministic, auditable PriorityRecord.
 */
export async function computePriority(
  issueId: string,
  analysis: AIAnalysisResult
): Promise<void> {
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: { id: true, reportCount: true, upvoteCount: true, downvoteCount: true },
  });
  if (!issue) return;

  const severityScore = SEVERITY_SCORE[analysis.severity] ?? 0.5;

  // Safety score: derived from severity (most heavily weighted)
  const safetyScore = analysis.severity === "CRITICAL" ? 1.0
    : analysis.severity === "HIGH" ? 0.8
    : analysis.severity === "MEDIUM" ? 0.5
    : 0.2;

  // Environmental score: higher for pollution/environmental categories
  const envCategories = new Set([
    "AIR_POLLUTION", "WATER_POLLUTION", "WATER_CONTAMINATION",
    "SEWAGE_LEAKAGE", "CARBON_HOTSPOTS", "HEAT_ISLAND_ZONES",
    "URBAN_FLOODING", "AIR_QUALITY_HOTSPOTS",
  ]);
  const environmentalScore = envCategories.has(analysis.category) ? 0.8 : 0.4;

  // People affected: estimated from severity + report count
  const peopleAffectedEst = analysis.severity === "CRITICAL" ? 500
    : analysis.severity === "HIGH" ? 200
    : analysis.severity === "MEDIUM" ? 50
    : 10;

  const peopleScore = Math.min(peopleAffectedEst / 500, 1.0);

  // Geographic spread estimate
  const geographicSpreadKm = analysis.severity === "CRITICAL" ? 2.0
    : analysis.severity === "HIGH" ? 1.0
    : 0.3;
  const geoScore = Math.min(geographicSpreadKm / 2.0, 1.0);

  // Community signal
  const netSignal = (issue.upvoteCount - issue.downvoteCount) / Math.max(1, issue.upvoteCount + issue.downvoteCount);
  const communityScore = Math.max(0, netSignal);

  // Composite weighted score
  const compositeScore =
    safetyScore * WEIGHTS.safety +
    environmentalScore * WEIGHTS.environmental +
    peopleScore * WEIGHTS.peopleAffected +
    geoScore * WEIGHTS.geographicSpread +
    severityScore * WEIGHTS.severity;

  // Map to priority band (government rule engine)
  const priority = compositeScore >= 0.75 ? "P1"
    : compositeScore >= 0.55 ? "P2"
    : compositeScore >= 0.35 ? "P3"
    : "P4";

  // Special rule: CRITICAL severity always → P1
  const finalPriority = analysis.severity === "CRITICAL" ? "P1" : priority;

  // Save priority record (full audit trail)
  await prisma.priorityRecord.upsert({
    where: { civicIssueId: issueId },
    create: {
      civicIssueId: issueId,
      priority: finalPriority,
      safetyScore,
      environmentalScore,
      peopleAffectedEst,
      geographicSpreadKm,
      severityScore,
      timeUnresolvedScore: 0,
      communitySignalScore: communityScore,
      ruleEngineVersion: RULE_ENGINE_VERSION,
      rationale: `Composite: ${compositeScore.toFixed(3)} → ${finalPriority}. Severity override: ${analysis.severity === "CRITICAL"}`,
    },
    update: {
      priority: finalPriority,
      safetyScore,
      environmentalScore,
      peopleAffectedEst,
      geographicSpreadKm,
      severityScore,
      communitySignalScore: communityScore,
      ruleEngineVersion: RULE_ENGINE_VERSION,
      rationale: `Re-computed. Composite: ${compositeScore.toFixed(3)} → ${finalPriority}`,
    },
  });

  // Update issue priority and score
  await prisma.civicIssue.update({
    where: { id: issueId },
    data: { priority: finalPriority, priorityScore: compositeScore },
  });
}
