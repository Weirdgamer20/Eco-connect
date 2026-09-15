import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import type { AuthenticatedRequest } from "../middleware/auth";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

/** GET /notifications — Paginated notification list */
notificationRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);

    return res.json({ success: true, data: items, meta: { page, limit, total, unread } });
  } catch (err) {
    return next(err);
  }
});

/** PUT /notifications/:id/read */
notificationRouter.put("/:id/read", async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: { read: true },
    });
    return res.json({ success: true, data: { read: true } });
  } catch (err) {
    return next(err);
  }
});

/** PUT /notifications/read-all */
notificationRouter.put("/read-all", async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    return res.json({ success: true, data: { message: "All notifications marked as read." } });
  } catch (err) {
    return next(err);
  }
});
