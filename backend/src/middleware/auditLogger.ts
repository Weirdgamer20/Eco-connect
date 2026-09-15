import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "./auth";

/**
 * Logs all state-changing requests to the AuditLog table.
 * Only logs mutations (POST, PUT, PATCH, DELETE).
 */
export function auditLogger(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  // Fire-and-forget — don't block the request
  setImmediate(async () => {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.user?.id || req.official?.id || null,
          actorRole: req.user?.role || (req.official ? "OFFICIAL" : null),
          action: `${method} ${req.path}`,
          resource: req.path.split("/")[1] || "unknown",
          detail: {
            body: sanitizeBody(req.body),
            query: req.query,
          } as any,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });
    } catch {
      // Audit logging must not crash the main request flow
    }
  });

  return next();
}

/**
 * Remove sensitive fields before logging request body.
 */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const safe = { ...(body as Record<string, unknown>) };
  for (const key of ["password", "otp", "token", "secret", "aadhaar"]) {
    if (key in safe) safe[key] = "[REDACTED]";
  }
  return safe;
}
