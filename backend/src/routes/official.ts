import { Router } from "express";
import { requireOfficialAuth } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { OfficialRejectSchema, OfficialResolveSchema, DisputeSchema, IssueQuerySchema } from "@ecoconnect/types";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { startVerificationWindow } from "../services/resolution.service";
import { rerouteOnRejection } from "../services/routing.service";
import { notificationQueue } from "../workers/queues";
import type { AuthenticatedRequest } from "../middleware/auth";

export const officialRouter = Router();

// All official routes require official auth
officialRouter.use(requireOfficialAuth as any);

/** GET /official/issues — Official's inbox */
officialRouter.get("/issues", async (req: AuthenticatedRequest, res, next) => {
  try {
    const official = (req as any).official;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {
      assignedOfficialId: official.id,
    };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.civicIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, title: true, category: true, status: true, priority: true,
          publicAreaLabel: true, reportCount: true, upvoteCount: true,
          slaDeadline: true, createdAt: true, updatedAt: true,
          slaRecord: { select: { slaType: true, deadline: true, warning1SentAt: true, warning2SentAt: true } },
        },
      }),
      prisma.civicIssue.count({ where }),
    ]);

    return res.json({ success: true, data: items, meta: { page, limit, total } });
  } catch (err) {
    return next(err);
  }
});

/** GET /official/issues/:id — Issue detail for official (includes AI analysis, citizen count) */
officialRouter.get("/issues/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const official = (req as any).official;
    const issue = await prisma.civicIssue.findFirst({
      where: {
        id: req.params.id as string,
        assignedOfficialId: official.id,
      },
      include: {
        grievances: {
          include: { media: true, aiAnalysis: true },
          orderBy: { createdAt: "desc" },
        },
        accountabilityEvents: { orderBy: { createdAt: "asc" } },
        officialResponses: { orderBy: { createdAt: "desc" } },
        slaRecord: true,
        priorityRecord: true,
        resolutionVerifications: true,
      },
    });

    if (!issue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Issue not found or not assigned to you." } });
    }

    return res.json({ success: true, data: issue });
  } catch (err) {
    return next(err);
  }
});

/** PUT /official/issues/:id/accept */
officialRouter.put("/issues/:id/accept", async (req: AuthenticatedRequest, res, next) => {
  try {
    const official = (req as any).official;
    await updateIssueStatus(req.params.id as string, official.id, "IN_PROGRESS", "ACCEPTED", req.body?.note);
    return res.json({ success: true, data: { status: "IN_PROGRESS" } });
  } catch (err) {
    return next(err);
  }
});

/** PUT /official/issues/:id/in-progress */
officialRouter.put("/issues/:id/in-progress", async (req: AuthenticatedRequest, res, next) => {
  try {
    const official = (req as any).official;
    await updateIssueStatus(req.params.id as string, official.id, "IN_PROGRESS", "IN_PROGRESS", req.body?.note);
    return res.json({ success: true, data: { status: "IN_PROGRESS" } });
  } catch (err) {
    return next(err);
  }
});

/** PUT /official/issues/:id/reject */
officialRouter.put(
  "/issues/:id/reject",
  validateBody(OfficialRejectSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const official = (req as any).official;
      await updateIssueStatus(req.params.id as string, official.id, "OPEN", "REJECTED", req.body.reason);

      // Auto-reroute to next official
      await rerouteOnRejection(req.params.id as string, official.id, req.body.reason);

      return res.json({ success: true, data: { status: "OPEN", rerouted: true } });
    } catch (err) {
      return next(err);
    }
  }
);

/** PUT /official/issues/:id/resolve */
officialRouter.put(
  "/issues/:id/resolve",
  validateBody(OfficialResolveSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const official = (req as any).official;
      const { resolutionNote, evidenceUrls = [] } = req.body;

      await startVerificationWindow(req.params.id as string, official.id, resolutionNote, evidenceUrls);

      return res.json({ success: true, data: { status: "AWAITING_VERIFICATION" } });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /official/issues/:id/dispute */
officialRouter.post(
  "/issues/:id/dispute",
  validateBody(DisputeSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const official = (req as any).official;

      // Immutable dispute event (cannot delete or modify the original accountability record)
      await prisma.accountabilityEvent.create({
        data: {
          civicIssueId: req.params.id as string,
          type: "OFFICIAL_DISPUTED",
          actorType: "OFFICIAL",
          actorId: official.id,
          detail: { reason: req.body.reason },
        },
      });

      return res.json({ success: true, data: { message: "Dispute recorded." } });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /official/stats — Department performance */
officialRouter.get("/stats", async (req: AuthenticatedRequest, res, next) => {
  try {
    const official = (req as any).official;
    const stats = await prisma.civicIssue.groupBy({
      by: ["status"],
      where: { assignedOfficialId: official.id },
      _count: { id: true },
    });

    const avgResolutionTime = await prisma.$queryRaw<Array<{ avg_ms: number }>>`
      SELECT AVG(
        EXTRACT(EPOCH FROM (ae_resolve."createdAt" - ae_create."createdAt")) * 1000
      ) as avg_ms
      FROM "AccountabilityEvent" ae_create
      JOIN "AccountabilityEvent" ae_resolve
        ON ae_create."civicIssueId" = ae_resolve."civicIssueId"
      JOIN "CivicIssue" ci ON ci.id = ae_create."civicIssueId"
      WHERE ae_create.type = 'ISSUE_CREATED'
        AND ae_resolve.type = 'RESOLVED'
        AND ci."assignedOfficialId" = ${official.id}
    `;

    return res.json({
      success: true,
      data: {
        byStatus: stats,
        avgResolutionTimeMs: avgResolutionTime[0]?.avg_ms || null,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function updateIssueStatus(
  issueId: string,
  officialId: string,
  newStatus: string,
  action: string,
  note?: string
) {
  const issue = await prisma.civicIssue.findFirst({
    where: { id: issueId, assignedOfficialId: officialId },
    select: { id: true, status: true },
  });

  if (!issue) {
    throw new AppError(404, "NOT_FOUND", "Issue not found or not assigned to you.");
  }

  await prisma.$transaction([
    prisma.civicIssue.update({
      where: { id: issueId },
      data: { status: newStatus as any },
    }),
    prisma.officialResponse.create({
      data: { officialId, civicIssueId: issueId, action, note },
    }),
    prisma.accountabilityEvent.create({
      data: {
        civicIssueId: issueId,
        type: action as any,
        actorType: "OFFICIAL",
        actorId: officialId,
        detail: { note },
      },
    }),
  ]);
}
