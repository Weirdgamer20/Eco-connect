import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { getEnv } from "../lib/env";
import { identityVerifier } from "../lib/identity";
import type {
  RegisterCitizenDto,
  VerifyOtpDto,
  LoginDto,
  OfficialLoginDto,
} from "@ecoconnect/types";

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// ─── Citizen Auth ─────────────────────────────────────────────────────────────

export async function registerCitizen(dto: RegisterCitizenDto) {
  // Enforce one-verified-identity constraint
  const existing = await prisma.user.findUnique({
    where: { phone: dto.phone },
  });
  if (existing) {
    throw new AppError(
      409,
      "PHONE_ALREADY_REGISTERED",
      "An account with this phone number already exists."
    );
  }

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      phone: dto.phone,
      passwordHash,
      anonymous: dto.anonymous ?? false,
      role: "CITIZEN",
    },
    select: { id: true, name: true, phone: true, anonymous: true, role: true },
  });

  // Send OTP for phone verification
  await sendOtp(dto.phone);

  return user;
}

export async function sendOtp(phone: string): Promise<void> {
  // Delete any existing OTP for this phone
  await prisma.oTPRecord.deleteMany({ where: { phone } });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.oTPRecord.create({
    data: { phone, otp, expiresAt },
  });

  // In mock mode, log to console only
  if (getEnv().SMS_MOCK === "true" || getEnv().IDENTITY_PROVIDER === "mock") {
    console.log(`[OTP MOCK] phone=${phone} otp=${otp} expires=${expiresAt.toISOString()}`);
    return;
  }

  // Real SMS send
  await identityVerifier.sendOtp(phone, otp);
}

export async function verifyOtp(dto: VerifyOtpDto) {
  const record = await prisma.oTPRecord.findUnique({
    where: { phone: dto.phone },
  });

  if (!record) {
    throw new AppError(400, "OTP_NOT_FOUND", "No OTP found for this phone number. Please request a new one.");
  }

  if (record.expiresAt < new Date()) {
    await prisma.oTPRecord.delete({ where: { phone: dto.phone } });
    throw new AppError(400, "OTP_EXPIRED", "The OTP has expired. Please request a new one.");
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.oTPRecord.delete({ where: { phone: dto.phone } });
    throw new AppError(429, "OTP_MAX_ATTEMPTS", "Too many incorrect attempts. Please request a new OTP.");
  }

  if (record.otp !== dto.otp) {
    await prisma.oTPRecord.update({
      where: { phone: dto.phone },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError(400, "OTP_INVALID", "Incorrect OTP. Please try again.");
  }

  // OTP verified — mark user phone as verified and clean up
  await prisma.$transaction([
    prisma.user.update({
      where: { phone: dto.phone },
      data: { phoneVerified: true },
    }),
    prisma.oTPRecord.delete({ where: { phone: dto.phone } }),
  ]);

  return { verified: true };
}

export async function loginCitizen(dto: LoginDto) {
  const user = await prisma.user.findUnique({
    where: { phone: dto.phone },
    select: {
      id: true,
      name: true,
      phone: true,
      passwordHash: true,
      phoneVerified: true,
      role: true,
      trustState: true,
      anonymous: true,
    },
  });

  if (!user) {
    // Constant-time comparison to prevent user enumeration
    await bcrypt.compare(dto.password, "$2b$12$invalidhashpadding000000000000000000000");
    throw new AppError(401, "INVALID_CREDENTIALS", "Phone number or password is incorrect.");
  }

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Phone number or password is incorrect.");
  }

  if (user.trustState === "FAKER") {
    throw new AppError(403, "ACCOUNT_SUSPENDED", "Your account has been suspended.");
  }

  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    tokens: issueTokens(user.id, user.role, user.trustState),
  };
}

export async function refreshToken(refreshTokenValue: string) {
  let payload: { sub: string; role: string; trustState: string; type: string };
  try {
    payload = jwt.verify(
      refreshTokenValue,
      process.env.JWT_REFRESH_SECRET!
    ) as typeof payload;
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Invalid or expired refresh token.");
  }

  if (payload.type !== "refresh") {
    throw new AppError(401, "INVALID_TOKEN", "Invalid token type.");
  }

  // Re-fetch fresh state in case trust state changed
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, trustState: true },
  });

  if (!user) {
    throw new AppError(401, "INVALID_TOKEN", "User not found.");
  }

  return issueTokens(user.id, user.role, user.trustState);
}

// ─── Official Auth ────────────────────────────────────────────────────────────

export async function loginOfficial(dto: OfficialLoginDto) {
  const official = await prisma.official.findUnique({
    where: { email: dto.email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      department: true,
      jurisdiction: true,
      active: true,
    },
  });

  if (!official) {
    await bcrypt.compare(dto.password, "$2b$12$invalidhashpadding000000000000000000000");
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const valid = await bcrypt.compare(dto.password, official.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  if (!official.active) {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Your official account is not active.");
  }

  const { passwordHash: _, ...safeOfficial } = official;

  const env = getEnv();
  const accessToken = jwt.sign(
    {
      sub: official.id,
      role: "OFFICIAL",
      department: official.department,
      jurisdiction: official.jurisdiction,
      type: "official_access",
    },
    process.env.JWT_SECRET!,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );

  return { official: safeOfficial, accessToken };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function issueTokens(userId: string, role: string, trustState: string) {
  const env = getEnv();

  const accessToken = jwt.sign(
    { sub: userId, role, trustState, type: "access" },
    process.env.JWT_SECRET!,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );

  const refreshToken = jwt.sign(
    { sub: userId, role, trustState, type: "refresh" },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );

  return { accessToken, refreshToken };
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
