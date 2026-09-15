import { Router } from "express";
import { requireAuth, requireCitizen, requireVerifiedPhone } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { uploadRateLimiter } from "../middleware/rateLimit";
import { uploadMiddleware } from "../lib/upload";
import {
  createGrievance,
  attachMedia,
  finalizeGrievance,
  getMyGrievances,
} from "../services/grievance.service";
import { CreateGrievanceSchema, IssueQuerySchema } from "@ecoconnect/types";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth";

export const grievanceRouter = Router();

// All grievance routes require auth + citizen role
grievanceRouter.use(requireAuth, requireCitizen, requireVerifiedPhone);

/** POST /grievances — Create a grievance (idempotent) */
grievanceRouter.post(
  "/",
  validateBody(CreateGrievanceSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await createGrievance(req.user!.id, req.body);
      return res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.grievance,
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /grievances/:id/media — Upload media files */
grievanceRouter.post(
  "/:id/media",
  uploadRateLimiter,
  uploadMiddleware.array("files", 3),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (!files.length) {
        return res.status(400).json({
          success: false,
          error: { code: "NO_FILES", message: "At least one file is required." },
        });
      }
      const result = await attachMedia(req.params.id as string, req.user!.id, files);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /grievances/:id/finalize — Submit for AI processing */
grievanceRouter.post(
  "/:id/finalize",
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const grievance = await finalizeGrievance(req.params.id as string, req.user!.id);
      return res.json({ success: true, data: grievance });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /grievances/my — Citizen's own grievances */
grievanceRouter.get(
  "/my",
  validateQuery(z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
  })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page, limit } = (req as any).parsedQuery;
      const result = await getMyGrievances(req.user!.id, page, limit);
      return res.json({ success: true, data: result.items, meta: { page: result.page, limit: result.limit, total: result.total } });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /grievances/mine — Alias for /my (frontend compatibility) */
grievanceRouter.get(
  "/mine",
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await getMyGrievances(req.user!.id, page, limit);
      return res.json({ success: true, data: result.items, meta: { page: result.page, limit: result.limit, total: result.total } });
    } catch (err) {
      return next(err);
    }
  }
);


/** GET /grievances/:id — Get single grievance (owner only) */
grievanceRouter.get(
  "/:id",
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { prisma } = await import("../lib/prisma");
      const grievance = await prisma.grievance.findFirst({
        where: { id: req.params.id as string, userId: req.user!.id },
        include: {
          media: true,
          aiAnalysis: true,
          civicIssue: { select: { id: true, title: true, status: true, priority: true } },
        },
      });
      if (!grievance) {
        return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Grievance not found." } });
      }
      return res.json({ success: true, data: grievance });
    } catch (err) {
      return next(err);
    }
  }
);
