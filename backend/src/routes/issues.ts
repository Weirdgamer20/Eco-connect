import { Router } from "express";
import { requireAuth, requireCitizen } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { voteRateLimiter, commentRateLimiter } from "../middleware/rateLimit";
import { getPublicIssues, getIssueDetail } from "../services/issue.service";
import { verifyResolution } from "../services/resolution.service";
import {
  VoteSchema,
  CommentSchema,
  VerifyResolutionSchema,
  IssueQuerySchema,
} from "@ecoconnect/types";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { AuthenticatedRequest } from "../middleware/auth";

export const issueRouter = Router();

/** GET /issues — Public issue feed */
issueRouter.get(
  "/",
  validateQuery(IssueQuerySchema),
  async (req, res, next) => {
    try {
      const params = (req as any).parsedQuery;
      const result = await getPublicIssues(params);
      return res.json({
        success: true,
        data: result.items,
        meta: { page: result.page, limit: result.limit, total: result.total },
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /issues/:id — Issue detail */
issueRouter.get("/:id", async (req, res, next) => {
  try {
    const issue = await getIssueDetail(req.params.id as string);
    if (!issue) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Issue not found." } });
    }
    return res.json({ success: true, data: issue });
  } catch (err) {
    return next(err);
  }
});

/** POST /issues/:id/vote — Vote on an issue (1 per user per issue) */
issueRouter.post(
  "/:id/vote",
  requireAuth,
  requireCitizen,
  voteRateLimiter,
  validateBody(VoteSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const issueId = req.params.id as string;
      const userId = req.user!.id;
      const { type } = req.body;

      // Check issue exists
      const issue = await prisma.civicIssue.findUnique({
        where: { id: issueId },
        select: { id: true, upvoteCount: true, downvoteCount: true },
      });
      if (!issue) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Issue not found." } });
      }

      // Upsert vote (unique constraint prevents duplicate votes)
      const existing = await prisma.vote.findUnique({
        where: { userId_civicIssueId: { userId, civicIssueId: issueId } },
      });

      if (existing) {
        if (existing.type === type) {
          // Same vote — remove it (toggle off)
          await prisma.$transaction([
            prisma.vote.delete({
              where: { userId_civicIssueId: { userId, civicIssueId: issueId } },
            }),
            prisma.civicIssue.update({
              where: { id: issueId },
              data: {
                [type === "UP" ? "upvoteCount" : "downvoteCount"]: { decrement: 1 },
              },
            }),
          ]);
          return res.json({ success: true, data: { action: "removed", type } });
        } else {
          // Different vote — update
          await prisma.$transaction([
            prisma.vote.update({
              where: { userId_civicIssueId: { userId, civicIssueId: issueId } },
              data: { type },
            }),
            prisma.civicIssue.update({
              where: { id: issueId },
              data: {
                [type === "UP" ? "upvoteCount" : "downvoteCount"]: { increment: 1 },
                [type === "UP" ? "downvoteCount" : "upvoteCount"]: { decrement: 1 },
              },
            }),
          ]);
          return res.json({ success: true, data: { action: "changed", type } });
        }
      }

      // New vote
      await prisma.$transaction([
        prisma.vote.create({
          data: { userId, civicIssueId: issueId, type },
        }),
        prisma.civicIssue.update({
          where: { id: issueId },
          data: {
            [type === "UP" ? "upvoteCount" : "downvoteCount"]: { increment: 1 },
          },
        }),
      ]);

      return res.status(201).json({ success: true, data: { action: "added", type } });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /issues/:id/my-vote — Get current user's vote on this issue */
issueRouter.get(
  "/:id/my-vote",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_civicIssueId: {
            userId: req.user!.id,
            civicIssueId: req.params.id as string,
          },
        },
        select: { type: true },
      });
      return res.json({ success: true, data: vote });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /issues/:id/comments */
issueRouter.post(
  "/:id/comments",
  requireAuth,
  requireCitizen,
  commentRateLimiter,
  validateBody(CommentSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const comment = await prisma.comment.create({
        data: {
          userId: req.user!.id,
          civicIssueId: req.params.id as string,
          content: req.body.content,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, name: true, anonymous: true } },
        },
      });
      return res.status(201).json({ success: true, data: comment });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /issues/:id/verify-resolution — Citizen confirms or rejects resolution */
issueRouter.post(
  "/:id/verify-resolution",
  requireAuth,
  requireCitizen,
  validateBody(VerifyResolutionSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await verifyResolution(req.params.id as string, req.user!.id, req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /issues/:id/accountability — Public accountability timeline */
issueRouter.get("/:id/accountability", async (req, res, next) => {
  try {
    const events = await prisma.accountabilityEvent.findMany({
      where: { civicIssueId: req.params.id as string },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ success: true, data: events });
  } catch (err) {
    return next(err);
  }
});
