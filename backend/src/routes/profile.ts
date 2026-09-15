import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import type { AuthenticatedRequest } from "../middleware/auth";

export const profileRouter = Router();

profileRouter.use(requireAuth);

/** GET /profile — Get own profile */
profileRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, phone: true, anonymous: true,
        role: true, trustState: true, phoneVerified: true,
        verifiedCount: true, createdAt: true,
        coupons: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        notificationPrefs: true,
      },
    });
    return res.json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
});

/** PUT /profile — Update profile */
profileRouter.put(
  "/",
  validateBody(z.object({
    name: z.string().min(2).max(100).optional(),
    anonymous: z.boolean().optional(),
  })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: req.body,
        select: { id: true, name: true, anonymous: true },
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  }
);

/** PUT /profile/notifications — Update notification preferences */
profileRouter.put(
  "/notifications",
  validateBody(z.object({
    radiusM: z.number().min(50).max(5000).optional(),
    categories: z.array(z.string()).optional(),
    enableEmail: z.boolean().optional(),
    enableSMS: z.boolean().optional(),
    enablePush: z.boolean().optional(),
  })),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const prefs = await prisma.notificationPreference.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, ...req.body },
        update: req.body,
      });
      return res.json({ success: true, data: prefs });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /profile/coupons — Coupon history */
profileRouter.get("/coupons", async (req: AuthenticatedRequest, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: coupons });
  } catch (err) {
    return next(err);
  }
});
