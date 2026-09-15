import { Router } from "express";
import { validateBody } from "../middleware/validate";
import { authRateLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";
import {
  registerCitizen,
  verifyOtp,
  loginCitizen,
  refreshToken,
  loginOfficial,
  sendOtp,
} from "../services/auth.service";
import {
  RegisterCitizenSchema,
  VerifyOtpSchema,
  LoginSchema,
  OfficialLoginSchema,
} from "@ecoconnect/types";
import { z } from "zod";

export const authRouter = Router();

// ─── Citizen auth ─────────────────────────────────────────────────────────────

/** POST /auth/register */
authRouter.post(
  "/register",
  authRateLimiter,
  validateBody(RegisterCitizenSchema),
  async (req, res, next) => {
    try {
      const user = await registerCitizen(req.body);
      return res.status(201).json({
        success: true,
        data: { user, message: "Registration successful. Please verify your phone number." },
      });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /auth/verify-otp */
authRouter.post(
  "/verify-otp",
  authRateLimiter,
  validateBody(VerifyOtpSchema),
  async (req, res, next) => {
    try {
      const result = await verifyOtp(req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /auth/resend-otp */
authRouter.post(
  "/resend-otp",
  authRateLimiter,
  validateBody(z.object({ phone: z.string() })),
  async (req, res, next) => {
    try {
      await sendOtp(req.body.phone);
      return res.json({ success: true, data: { message: "OTP sent." } });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /auth/login */
authRouter.post(
  "/login",
  authRateLimiter,
  validateBody(LoginSchema),
  async (req, res, next) => {
    try {
      const result = await loginCitizen(req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

/** POST /auth/refresh */
authRouter.post(
  "/refresh",
  validateBody(z.object({ refreshToken: z.string() })),
  async (req, res, next) => {
    try {
      const tokens = await refreshToken(req.body.refreshToken);
      return res.json({ success: true, data: tokens });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /auth/me */
authRouter.get("/me", requireAuth, async (req: any, res, next) => {
  try {
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, phone: true, anonymous: true,
        role: true, trustState: true, phoneVerified: true,
        verifiedCount: true, createdAt: true,
      },
    });
    return res.json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
});

// ─── Official auth ────────────────────────────────────────────────────────────

/** POST /auth/official/login */
authRouter.post(
  "/official/login",
  authRateLimiter,
  validateBody(OfficialLoginSchema),
  async (req, res, next) => {
    try {
      const result = await loginOfficial(req.body);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);
