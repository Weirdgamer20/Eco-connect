import { prisma } from "../lib/prisma";
import { getEnv } from "../lib/env";
import type { AIAnalysisResult } from "@ecoconnect/types";

const MATCH_CONFIDENCE_THRESHOLD = 0.75;
const GEO_RADIUS_M = 500; // meters — cluster radius for same-issue grouping

interface CreateOrMergeInput {
  grievance: {
    id: string;
    latitude: number;
    longitude: number;
    category: string;
    description: string;
  };
  textAnalysis: AIAnalysisResult;
  embedding: number[];
}

/**
 * Finds an existing similar civic issue or creates a new one.
 * Uses pgvector cosine similarity + geographic bounding.
 */
export async function createCivicIssueOrMerge(
  input: CreateOrMergeInput
): Promise<{ issue: { id: string }; isNew: boolean }> {
  const { grievance, textAnalysis, embedding } = input;
  const env = getEnv();

  // Vector similarity search using pgvector
  // Find issues in the same category/department within geo radius with similar embeddings
  const embeddingStr = `[${embedding.join(",")}]`;

  const nearbyIssues = await prisma.$queryRaw<
    Array<{ id: string; similarity: number }>
  >`
    SELECT ci.id,
           1 - (ci.embedding <=> ${embeddingStr}::vector) AS similarity
    FROM "CivicIssue" ci
    WHERE ci.status NOT IN ('CLOSED', 'AUTO_CLOSED')
      AND ci.department = ${textAnalysis.authorityDepartment}::"Department"
      AND earth_distance(
            ll_to_earth(ci.latitude, ci.longitude),
            ll_to_earth(${grievance.latitude}, ${grievance.longitude})
          ) <= ${GEO_RADIUS_M}
      AND ci.embedding IS NOT NULL
    ORDER BY similarity DESC
    LIMIT 5
  `;

  // Pick the best match above the confidence threshold
  const bestMatch = nearbyIssues.find((r: { id: string; similarity: number }) => r.similarity >= MATCH_CONFIDENCE_THRESHOLD);

  if (bestMatch) {
    // Merge: increment report count and update priority score
    await prisma.civicIssue.update({
      where: { id: bestMatch.id },
      data: {
        reportCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Store match record for audit
    await prisma.aIMatchResult.create({
      data: {
        analysisId: (
          await prisma.grievance.findUnique({
            where: { id: grievance.id },
            select: { aiAnalysisId: true },
          })
        )?.aiAnalysisId || "",
        matchedIssueId: bestMatch.id,
        matchConfidence: bestMatch.similarity,
        matchRationale: `Vector similarity ${bestMatch.similarity.toFixed(3)} >= threshold ${MATCH_CONFIDENCE_THRESHOLD}`,
      },
    }).catch(() => {}); // Non-critical

    return { issue: { id: bestMatch.id }, isNew: false };
  }

  // No match — create a new civic issue
  const { publicLat, publicLng } = approximateLocation(
    grievance.latitude,
    grievance.longitude
  );

  const issue = await prisma.civicIssue.create({
    data: {
      title: `${formatCategory(textAnalysis.category)}: ${truncate(grievance.description, 80)}`,
      category: textAnalysis.category,
      department: textAnalysis.authorityDepartment,
      status: "OPEN",
      priority: "P3", // Will be updated by priority service
      latitude: grievance.latitude,
      longitude: grievance.longitude,
      publicLatitude: publicLat,
      publicLongitude: publicLng,
      publicAreaLabel: env.JURISDICTION_NAME,
      jurisdiction: env.JURISDICTION_NAME,
      reportCount: 1,
      // Store embedding as raw SQL
    },
  });

  // Update embedding separately (Prisma doesn't support vector type directly)
  await prisma.$executeRaw`
    UPDATE "CivicIssue"
    SET embedding = ${embeddingStr}::vector
    WHERE id = ${issue.id}
  `;

  // Create accountability event
  await prisma.accountabilityEvent.create({
    data: {
      civicIssueId: issue.id,
      type: "ISSUE_CREATED",
      actorType: "SYSTEM",
      detail: { grievanceId: grievance.id, category: textAnalysis.category },
    },
  });

  return { issue, isNew: true };
}

/**
 * Public feed of civic issues with optional geo + category filters.
 */
export async function getPublicIssues(params: {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  status?: string;
  department?: string;
  priority?: string;
  page: number;
  limit: number;
}) {
  const { page, limit, lat, lng, radius = 150 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.category) where.category = params.category;
  if (params.status) where.status = params.status;
  if (params.department) where.department = params.department;
  if (params.priority) where.priority = params.priority;

  // If geo filter provided, use a raw query; otherwise use Prisma
  if (lat !== undefined && lng !== undefined) {
    const issues = await prisma.$queryRaw<unknown[]>`
      SELECT
        ci.id, ci.title, ci.category, ci.department, ci.status, ci.priority,
        ci."publicLatitude", ci."publicLongitude", ci."publicAreaLabel",
        ci."reportCount", ci."upvoteCount", ci."downvoteCount",
        ci."createdAt", ci."updatedAt",
        earth_distance(
          ll_to_earth(ci.latitude, ci.longitude),
          ll_to_earth(${lat}, ${lng})
        ) AS distance_m
      FROM "CivicIssue" ci
      WHERE earth_distance(
              ll_to_earth(ci.latitude, ci.longitude),
              ll_to_earth(${lat}, ${lng})
            ) <= ${radius}
        AND ci.status NOT IN ('CLOSED', 'AUTO_CLOSED')
      ORDER BY distance_m ASC, ci."priorityScore" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    return { items: issues, page, limit };
  }

  const [items, total] = await Promise.all([
    prisma.civicIssue.findMany({
      where: { ...where, status: { notIn: ["CLOSED", "AUTO_CLOSED"] } } as any,
      skip,
      take: limit,
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, category: true, department: true,
        status: true, priority: true,
        publicLatitude: true, publicLongitude: true, publicAreaLabel: true,
        reportCount: true, upvoteCount: true, downvoteCount: true,
        createdAt: true, updatedAt: true,
        // Note: internal exact lat/lng is NOT returned in public feed
      },
    }),
    prisma.civicIssue.count({
      where: { ...where, status: { notIn: ["CLOSED", "AUTO_CLOSED"] } } as any,
    }),
  ]);

  return { items, total, page, limit };
}

/**
 * Returns full issue detail (public-safe fields only for non-officials).
 */
export async function getIssueDetail(issueId: string) {
  const issue = await prisma.civicIssue.findUnique({
    where: { id: issueId },
    select: {
      id: true, title: true, category: true, department: true,
      status: true, priority: true, jurisdiction: true,
      publicLatitude: true, publicLongitude: true, publicAreaLabel: true,
      reportCount: true, upvoteCount: true, downvoteCount: true,
      resolutionNote: true, resolutionEvidenceUrls: true,
      slaDeadline: true, createdAt: true, updatedAt: true,
      grievances: {
        select: {
          id: true, status: true, anonymous: true, createdAt: true,
          media: { select: { id: true, type: true, publicUrl: true } },
          // Never expose userId in public detail
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      accountabilityEvents: {
        select: { id: true, type: true, detail: true, createdAt: true, actorType: true },
        orderBy: { createdAt: "asc" },
      },
      officialResponses: {
        select: { id: true, action: true, note: true, evidenceUrls: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      comments: {
        where: { flagged: false },
        select: {
          id: true, content: true, createdAt: true,
          user: { select: { id: true, name: true, anonymous: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      slaRecord: true,
    },
  });

  return issue;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Approximates a lat/lng to ~200m precision for public display.
 * Prevents revealing exact citizen/issue location.
 */
function approximateLocation(lat: number, lng: number) {
  const precision = 1000; // round to ~111m at equator
  return {
    publicLat: Math.round(lat * precision) / precision,
    publicLng: Math.round(lng * precision) / precision,
  };
}

function formatCategory(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function truncate(str: string, len: number): string {
  return str.length <= len ? str : str.slice(0, len - 1) + "…";
}
