import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { prisma } from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    trustState: string;
  };
  official?: {
    id: string;
    department: string;
    jurisdiction: string;
  };
}

/**
 * Verifies JWT from Authorization: Bearer <token> header.
 * Attaches decoded user to req.user.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: string;
      trustState: string;
      type: string;
    };

    if (payload.type !== "access") {
      return next(new AppError(401, "UNAUTHORIZED", "Invalid token type."));
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      trustState: payload.trustState,
    };

    return next();
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token."));
  }
}

/**
 * Verifies official JWT token.
 */
export function requireOfficialAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: string;
      department: string;
      jurisdiction: string;
      type: string;
    };

    if (payload.type !== "official_access") {
      return next(new AppError(401, "UNAUTHORIZED", "Invalid token type."));
    }

    req.official = {
      id: payload.sub,
      department: payload.department,
      jurisdiction: payload.jurisdiction,
    };

    return next();
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token."));
  }
}

/**
 * Requires citizen role.
 */
export function requireCitizen(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
  }
  if (req.user.role !== "CITIZEN" && req.user.role !== "ADMIN") {
    return next(new AppError(403, "FORBIDDEN", "Citizen access required."));
  }
  if (req.user.trustState === "FAKER") {
    return next(
      new AppError(403, "ACCOUNT_SUSPENDED", "Your account has been suspended due to repeated policy violations.")
    );
  }
  return next();
}

/**
 * Checks phone OTP verification status.
 * FAKER users cannot submit grievances or vote.
 */
export async function requireVerifiedPhone(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new AppError(401, "UNAUTHORIZED", "Authentication required."));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { phoneVerified: true },
  });

  if (!user?.phoneVerified) {
    return next(
      new AppError(403, "PHONE_NOT_VERIFIED", "Please verify your phone number before proceeding.")
    );
  }

  return next();
}
