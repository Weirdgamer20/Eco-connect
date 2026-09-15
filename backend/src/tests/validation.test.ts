import { describe, it, expect } from "vitest";
import {
  RegisterCitizenSchema,
  LoginSchema,
  CreateGrievanceSchema,
  VoteSchema,
  VerifyResolutionSchema,
  OfficialRejectSchema,
  OfficialResolveSchema,
} from "@ecoconnect/types";

describe("Validation Schemas (@ecoconnect/types)", () => {
  describe("RegisterCitizenSchema", () => {
    it("should accept valid registration data", () => {
      const valid = {
        name: "Aarav Sharma",
        phone: "+919876543210",
        password: "securePassword123!",
      };
      const parsed = RegisterCitizenSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      const invalid = {
        name: "Aarav Sharma",
        phone: "123",
        password: "securePassword123!",
      };
      const parsed = RegisterCitizenSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should reject short passwords", () => {
      const invalid = {
        name: "Aarav Sharma",
        phone: "+919876543210",
        password: "short",
      };
      const parsed = RegisterCitizenSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("CreateGrievanceSchema", () => {
    it("should accept valid grievance submission data", () => {
      const valid = {
        category: "WATER_POLLUTION",
        description: "Industrial wastewater being discharged into the local canal causing foul odor and discolored water.",
        latitude: 28.6139,
        longitude: 77.2090,
        anonymous: false,
        idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
      };
      const parsed = CreateGrievanceSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("should reject out-of-range coordinates", () => {
      const invalid = {
        category: "WATER_POLLUTION",
        description: "Industrial wastewater discharge into the canal.",
        latitude: 195.0, // invalid latitude
        longitude: 77.2090,
        idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
      };
      const parsed = CreateGrievanceSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should reject too brief descriptions", () => {
      const invalid = {
        category: "WATER_POLLUTION",
        description: "dirty",
        latitude: 28.6139,
        longitude: 77.2090,
        idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
      };
      const parsed = CreateGrievanceSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("VoteSchema", () => {
    it("should accept UP and DOWN votes", () => {
      expect(VoteSchema.safeParse({ type: "UP" }).success).toBe(true);
      expect(VoteSchema.safeParse({ type: "DOWN" }).success).toBe(true);
    });

    it("should reject invalid vote types", () => {
      expect(VoteSchema.safeParse({ type: "SIDEWAYS" }).success).toBe(false);
    });
  });

  describe("VerifyResolutionSchema", () => {
    it("should accept resolution confirmation", () => {
      const valid = {
        confirmed: true,
        reason: "The road was repaired cleanly.",
      };
      expect(VerifyResolutionSchema.safeParse(valid).success).toBe(true);
    });

    it("should accept resolution rejection with notes", () => {
      const valid = {
        confirmed: false,
        reason: "The pothole is still there, only temporary sand was dumped.",
      };
      expect(VerifyResolutionSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("Official Action Schemas", () => {
    it("should require reason when rejecting an issue", () => {
      expect(OfficialRejectSchema.safeParse({ reason: "Outside departmental boundary." }).success).toBe(true);
      expect(OfficialRejectSchema.safeParse({ reason: "" }).success).toBe(false);
    });

    it("should validate resolution note", () => {
      expect(OfficialResolveSchema.safeParse({
        resolutionNote: "Replaced faulty drainage pipe and restored road surface.",
        evidenceUrls: ["https://example.com/proof.jpg"],
      }).success).toBe(true);
    });
  });
});
