import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { getEnv } from "./env";
import { AIAnalysisResultSchema, AIMatchResultSchema } from "@ecoconnect/types";
import type { AIAnalysisResult } from "@ecoconnect/types";

let _genAI: GoogleGenerativeAI | undefined;
let _model: GenerativeModel | undefined;
let _embeddingModel: GenerativeModel | undefined;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const env = getEnv();
    _genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return _genAI;
}

function getModel(): GenerativeModel {
  if (!_model) {
    const env = getEnv();
    _model = getGenAI().getGenerativeModel({ model: env.GEMINI_MODEL });
  }
  return _model;
}

function getEmbeddingModel(): GenerativeModel {
  if (!_embeddingModel) {
    const env = getEnv();
    _embeddingModel = getGenAI().getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
  }
  return _embeddingModel;
}

const PROMPT_VERSION = "v1.0";

// ─── Text Analysis ────────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are an evidence analysis system for a civic issue reporting platform called EcoConnect.
Your task is to analyze a citizen's grievance report and return a structured JSON assessment.

CATEGORIES (use exact values):
AIR_POLLUTION, WATER_POLLUTION, NOISE_POLLUTION, PLASTIC_POLLUTION, WASTE_BURNING, ILLEGAL_DUMPING,
SEWAGE_LEAKAGE, WATER_CONTAMINATION, ILLEGAL_TREE_CUTTING, CONSTRUCTION_POLLUTION,
POTHOLES, ROAD_DAMAGE, BROKEN_INFRASTRUCTURE, TRAFFIC_HAZARDS, DRAIN_BLOCKAGE, WATER_LEAKAGE,
UNSAFE_PUBLIC_SPACES, ENCROACHMENT, CARBON_HOTSPOTS, HEAT_ISLAND_ZONES, URBAN_FLOODING,
WATER_STRESS_ZONES, WASTE_HOTSPOTS, AIR_QUALITY_HOTSPOTS, RENEWABLE_ENERGY_ADOPTION, OTHER

DEPARTMENTS (use exact values): AIR_QUALITY, WASTE_MANAGEMENT, ROAD_CONDITION, GENERAL

SEVERITY VALUES: CRITICAL, HIGH, MEDIUM, LOW, NEGLIGIBLE

EVIDENCE FLAGS:
- INCONSISTENT_LOCATION: media GPS doesn't match submitted location
- METADATA_MISMATCH: timestamps or other metadata seem wrong
- POSSIBLE_REUSE: media may have been recycled from another source
- UNRELATED_CONTENT: media doesn't match the description
- LOW_QUALITY: evidence is unclear or too low quality to verify
- EXPLICIT_CONTENT: inappropriate content detected

RULES:
1. Return ONLY valid JSON. No markdown, no explanation, no code blocks.
2. confidenceScore values must be between 0.0 and 1.0
3. If the evidence is clearly a safety threat, use CRITICAL severity
4. Be conservative with POSSIBLE_REUSE — require strong signals
5. Never invent details not present in the evidence`;

/**
 * Analyzes grievance text description.
 * Returns structured AI analysis result.
 */
export async function analyzeGrievanceText(
  description: string,
  category: string
): Promise<{ raw: unknown; parsed: AIAnalysisResult; promptVersion: string }> {
  const prompt = `${ANALYSIS_SYSTEM_PROMPT}

GRIEVANCE:
Category (citizen-selected): ${category}
Description: ${description}

Return JSON matching this exact schema:
{
  "category": "...",
  "categoryConfidence": 0.0,
  "severity": "...",
  "severityRationale": "...",
  "authorityDepartment": "...",
  "authorityConfidence": 0.0,
  "evidenceFlags": [],
  "overallConfidence": 0.0,
  "summary": "...",
  "needsClarification": false,
  "clarificationPrompt": null
}`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    // Try to extract JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
    raw = JSON.parse(match[0]);
  }

  const parsed = AIAnalysisResultSchema.parse(raw);
  return { raw, parsed, promptVersion: PROMPT_VERSION };
}

/**
 * Analyzes image(s) from base64 buffers.
 */
export async function analyzeImages(
  imageBuffers: Array<{ data: string; mimeType: string }>,
  description: string
): Promise<string> {
  const model = getModel();
  const imageParts = imageBuffers.map((img) => ({
    inlineData: { data: img.data, mimeType: img.mimeType },
  }));

  const result = await model.generateContent([
    `You are analyzing citizen-submitted evidence for a civic issue report.
    Description: "${description}"
    
    For each image, evaluate:
    1. Does it match the description?
    2. Is there evidence of the reported problem?
    3. Any signs the image is reused or manipulated?
    4. Approximate location type visible?
    5. Severity of visible issue?
    
    Return a brief JSON: {"matches_description": true/false, "visible_issue": "...", "severity_visible": "HIGH/MEDIUM/LOW", "reuse_suspected": false, "notes": "..."}`,
    ...imageParts,
  ]);

  return result.response.text();
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

/**
 * Generates a text embedding for issue similarity search.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// ─── Reopen Review ────────────────────────────────────────────────────────────

/**
 * AI reviews whether an issue should be reopened based on citizen rejection + evidence.
 */
export async function reviewReopenRequest(
  issueTitle: string,
  resolutionNote: string,
  citizenReason: string,
  communitySignals: { upvotes: number; downvotes: number }
): Promise<{ shouldReopen: boolean; rationale: string; confidence: number }> {
  const model = getModel();
  const prompt = `You are reviewing a citizen's rejection of an official resolution for a civic issue.

Issue: "${issueTitle}"
Official resolution note: "${resolutionNote}"
Citizen rejection reason: "${citizenReason}"
Community signals: ${communitySignals.upvotes} experiencing / ${communitySignals.downvotes} not experiencing

Should this issue be reopened? Consider:
- Is the citizen rejection credible?
- Does the community signal support the rejection?
- Is the official resolution note plausible?

Return JSON: {"shouldReopen": true/false, "rationale": "...", "confidence": 0.0}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { shouldReopen: false, rationale: "AI review failed — defaulting to no reopen", confidence: 0 };
  return JSON.parse(match[0]);
}
