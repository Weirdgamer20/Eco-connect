import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const UserTrustState = z.enum([
  "TRUSTED",
  "SUSPICIOUS",
  "VERIFICATION",
  "FAKER",
]);
export type UserTrustState = z.infer<typeof UserTrustState>;

export const UserRole = z.enum(["CITIZEN", "OFFICIAL", "ADMIN"]);
export type UserRole = z.infer<typeof UserRole>;

export const GrievanceStatus = z.enum([
  "DRAFT",
  "SUBMITTED",
  "AI_PENDING",
  "MATCHED",
  "NEW_ISSUE",
  "ROUTED",
  "REJECTED",
]);
export type GrievanceStatus = z.infer<typeof GrievanceStatus>;

export const IssueStatus = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_VERIFICATION",
  "RESOLVED",
  "CLOSED",
  "AUTO_CLOSED",
  "REOPENED",
  "ESCALATED",
]);
export type IssueStatus = z.infer<typeof IssueStatus>;

export const Priority = z.enum(["P1", "P2", "P3", "P4"]);
export type Priority = z.infer<typeof Priority>;

export const IssueCategory = z.enum([
  "AIR_POLLUTION",
  "WATER_POLLUTION",
  "NOISE_POLLUTION",
  "PLASTIC_POLLUTION",
  "WASTE_BURNING",
  "ILLEGAL_DUMPING",
  "SEWAGE_LEAKAGE",
  "WATER_CONTAMINATION",
  "ILLEGAL_TREE_CUTTING",
  "CONSTRUCTION_POLLUTION",
  "POTHOLES",
  "ROAD_DAMAGE",
  "BROKEN_INFRASTRUCTURE",
  "TRAFFIC_HAZARDS",
  "DRAIN_BLOCKAGE",
  "WATER_LEAKAGE",
  "UNSAFE_PUBLIC_SPACES",
  "ENCROACHMENT",
  "CARBON_HOTSPOTS",
  "HEAT_ISLAND_ZONES",
  "URBAN_FLOODING",
  "WATER_STRESS_ZONES",
  "WASTE_HOTSPOTS",
  "AIR_QUALITY_HOTSPOTS",
  "RENEWABLE_ENERGY_ADOPTION",
  "OTHER",
]);
export type IssueCategory = z.infer<typeof IssueCategory>;

export const Department = z.enum([
  "AIR_QUALITY",
  "WASTE_MANAGEMENT",
  "ROAD_CONDITION",
  "GENERAL",
]);
export type Department = z.infer<typeof Department>;

export const VoteType = z.enum(["UP", "DOWN"]);
export type VoteType = z.infer<typeof VoteType>;

export const AccountabilityEventType = z.enum([
  "ISSUE_CREATED",
  "ROUTED",
  "NOTIFIED_OFFICIAL",
  "ACCEPTED",
  "REJECTED",
  "IN_PROGRESS",
  "RESOLVED",
  "VERIFICATION_SENT",
  "CONFIRMED_FIXED",
  "REJECTED_RESOLUTION",
  "REOPENED",
  "AUTO_CLOSED",
  "SLA_WARNING_1",
  "SLA_GRACE_PERIOD",
  "SLA_WARNING_2",
  "ESCALATED",
  "OFFICIAL_DISPUTED",
  "COMMUNITY_POLL",
]);
export type AccountabilityEventType = z.infer<typeof AccountabilityEventType>;

export const NotificationType = z.enum([
  "NEARBY_ISSUE",
  "YOUR_GRIEVANCE",
  "RESOLUTION_VERIFICATION",
  "OFFICIAL_UPDATE",
  "ESCALATION",
  "REWARD",
  "FRAUD_WARNING",
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const AISeverity = z.enum([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NEGLIGIBLE",
]);
export type AISeverity = z.infer<typeof AISeverity>;

// ─── Core schemas ─────────────────────────────────────────────────────────────

export const RegisterCitizenSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Must be a valid Indian mobile number (+91XXXXXXXXXX)"),
  password: z.string().min(8).max(100),
  anonymous: z.boolean().optional().default(false),
});
export type RegisterCitizenDto = z.infer<typeof RegisterCitizenSchema>;

export const VerifyOtpSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6),
});
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

export const LoginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const OfficialLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type OfficialLoginDto = z.infer<typeof OfficialLoginSchema>;

export const CreateGrievanceSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: IssueCategory,
  description: z.string().min(20).max(2000),
  anonymous: z.boolean().optional().default(false),
  idempotencyKey: z.string().uuid(),
});
export type CreateGrievanceDto = z.infer<typeof CreateGrievanceSchema>;

export const VoteSchema = z.object({
  type: VoteType,
});
export type VoteDto = z.infer<typeof VoteSchema>;

export const CommentSchema = z.object({
  content: z.string().min(1).max(1000),
});
export type CommentDto = z.infer<typeof CommentSchema>;

export const VerifyResolutionSchema = z.object({
  confirmed: z.boolean(),
  reason: z.string().max(1000).optional(),
});
export type VerifyResolutionDto = z.infer<typeof VerifyResolutionSchema>;

export const OfficialRejectSchema = z.object({
  reason: z.string().min(10).max(1000),
});
export type OfficialRejectDto = z.infer<typeof OfficialRejectSchema>;

export const OfficialResolveSchema = z.object({
  resolutionNote: z.string().min(10).max(2000),
  evidenceUrls: z.array(z.string().url()).max(5).optional(),
});
export type OfficialResolveDto = z.infer<typeof OfficialResolveSchema>;

export const DisputeSchema = z.object({
  reason: z.string().min(20).max(2000),
});
export type DisputeDto = z.infer<typeof DisputeSchema>;

export const IssueQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(50).max(5000).optional().default(150),
  category: IssueCategory.optional(),
  status: IssueStatus.optional(),
  department: Department.optional(),
  priority: Priority.optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});
export type IssueQueryDto = z.infer<typeof IssueQuerySchema>;

// ─── AI output schema ─────────────────────────────────────────────────────────

export const AIAnalysisResultSchema = z.object({
  category: IssueCategory,
  categoryConfidence: z.number().min(0).max(1),
  severity: AISeverity,
  severityRationale: z.string(),
  authorityDepartment: Department,
  authorityConfidence: z.number().min(0).max(1),
  evidenceFlags: z.array(
    z.object({
      type: z.enum([
        "INCONSISTENT_LOCATION",
        "METADATA_MISMATCH",
        "POSSIBLE_REUSE",
        "UNRELATED_CONTENT",
        "LOW_QUALITY",
        "EXPLICIT_CONTENT",
      ]),
      confidence: z.number().min(0).max(1),
      detail: z.string(),
    })
  ),
  overallConfidence: z.number().min(0).max(1),
  summary: z.string().max(500),
  needsClarification: z.boolean(),
  clarificationPrompt: z.string().optional(),
});
export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>;

export const AIMatchResultSchema = z.object({
  matchedIssueId: z.string().nullable(),
  matchConfidence: z.number().min(0).max(1),
  matchRationale: z.string(),
});
export type AIMatchResult = z.infer<typeof AIMatchResultSchema>;

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─── Category metadata (for UI) ──────────────────────────────────────────────

export const CATEGORY_DISPLAY: Record<
  IssueCategory,
  { label: string; icon: string; department: Department }
> = {
  AIR_POLLUTION: { label: "Air Pollution", icon: "🌫️", department: "AIR_QUALITY" },
  WATER_POLLUTION: { label: "Water Pollution", icon: "💧", department: "WASTE_MANAGEMENT" },
  NOISE_POLLUTION: { label: "Noise Pollution", icon: "🔊", department: "GENERAL" },
  PLASTIC_POLLUTION: { label: "Plastic Pollution", icon: "♻️", department: "WASTE_MANAGEMENT" },
  WASTE_BURNING: { label: "Waste Burning", icon: "🔥", department: "AIR_QUALITY" },
  ILLEGAL_DUMPING: { label: "Illegal Dumping", icon: "🗑️", department: "WASTE_MANAGEMENT" },
  SEWAGE_LEAKAGE: { label: "Sewage Leakage", icon: "🚽", department: "WASTE_MANAGEMENT" },
  WATER_CONTAMINATION: { label: "Water Contamination", icon: "🧪", department: "WASTE_MANAGEMENT" },
  ILLEGAL_TREE_CUTTING: { label: "Illegal Tree Cutting", icon: "🌳", department: "GENERAL" },
  CONSTRUCTION_POLLUTION: { label: "Construction Pollution", icon: "🏗️", department: "AIR_QUALITY" },
  POTHOLES: { label: "Potholes", icon: "🕳️", department: "ROAD_CONDITION" },
  ROAD_DAMAGE: { label: "Road Damage", icon: "🛣️", department: "ROAD_CONDITION" },
  BROKEN_INFRASTRUCTURE: { label: "Broken Infrastructure", icon: "🔧", department: "ROAD_CONDITION" },
  TRAFFIC_HAZARDS: { label: "Traffic Hazards", icon: "⚠️", department: "ROAD_CONDITION" },
  DRAIN_BLOCKAGE: { label: "Drain Blockage", icon: "🚧", department: "ROAD_CONDITION" },
  WATER_LEAKAGE: { label: "Water Leakage", icon: "💦", department: "WASTE_MANAGEMENT" },
  UNSAFE_PUBLIC_SPACES: { label: "Unsafe Public Spaces", icon: "🚷", department: "GENERAL" },
  ENCROACHMENT: { label: "Encroachment", icon: "🏚️", department: "GENERAL" },
  CARBON_HOTSPOTS: { label: "Carbon Hotspots", icon: "🌡️", department: "AIR_QUALITY" },
  HEAT_ISLAND_ZONES: { label: "Heat Island Zones", icon: "☀️", department: "AIR_QUALITY" },
  URBAN_FLOODING: { label: "Urban Flooding", icon: "🌊", department: "ROAD_CONDITION" },
  WATER_STRESS_ZONES: { label: "Water Stress Zones", icon: "🏜️", department: "WASTE_MANAGEMENT" },
  WASTE_HOTSPOTS: { label: "Waste Hotspots", icon: "🗑️", department: "WASTE_MANAGEMENT" },
  AIR_QUALITY_HOTSPOTS: { label: "Air Quality Hotspots", icon: "😷", department: "AIR_QUALITY" },
  RENEWABLE_ENERGY_ADOPTION: { label: "Renewable Energy", icon: "⚡", department: "GENERAL" },
  OTHER: { label: "Other", icon: "📋", department: "GENERAL" },
};

export const STATUS_DISPLAY: Record<IssueStatus, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "#315A78" },
  IN_PROGRESS: { label: "In Progress", color: "#B8873D" },
  AWAITING_VERIFICATION: { label: "Awaiting Verification", color: "#667783" },
  RESOLVED: { label: "Resolved", color: "#5D806A" },
  CLOSED: { label: "Closed", color: "#68706C" },
  AUTO_CLOSED: { label: "Auto Closed", color: "#68706C" },
  REOPENED: { label: "Reopened", color: "#B8873D" },
  ESCALATED: { label: "Escalated", color: "#A84F4F" },
};

export const PRIORITY_DISPLAY: Record<Priority, { label: string; color: string }> = {
  P1: { label: "Critical", color: "#A84F4F" },
  P2: { label: "High", color: "#B8873D" },
  P3: { label: "Medium", color: "#315A78" },
  P4: { label: "Low", color: "#667783" },
};
