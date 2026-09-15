import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("Authentication Security Primitives", () => {
  const JWT_SECRET = "test-secret-at-least-32-characters-long-12345";

  it("should hash and securely verify passwords", async () => {
    const password = "mySecurePassword@2026";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    expect(hash).not.toBe(password);
    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);

    const isWrong = await bcrypt.compare("wrongPassword", hash);
    expect(isWrong).toBe(false);
  });

  it("should issue and decode valid JWT access tokens", () => {
    const payload = {
      id: "user_cuid_12345",
      phone: "+919876543210",
      role: "CITIZEN",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, JWT_SECRET) as typeof payload & { iat: number; exp: number };
    expect(decoded.id).toBe(payload.id);
    expect(decoded.phone).toBe(payload.phone);
    expect(decoded.role).toBe("CITIZEN");
  });

  it("should reject expired or forged tokens", () => {
    const forgedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M";
    expect(() => jwt.verify(forgedToken, JWT_SECRET)).toThrow();
  });
});
