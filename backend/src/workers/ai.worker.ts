import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { analyzeGrievanceText, analyzeImages, generateEmbedding } from "../lib/gemini";
import { notificationQueue, slaQueue } from "./queues";
import { computePriority } from "../services/priority.service";
import { routeToAuthority } from "../services/routing.service";
import { createCivicIssueOrMerge } from "../services/issue.service";
import fs from "fs";

export function startAIWorker() {
  const worker = new Worker(
    "ai-analysis",
    async (job: Job) => {
      if (job.name === "analyzeGrievance") {
        await processGrievance(job.data.grievanceId);
      }
    },
    {
      connection: getRedis(),
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[AIWorker] Job ${job.id} completed for grievance ${job.data.grievanceId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[AIWorker] Job ${job?.id} failed:`, err.message);
    if (job?.data.grievanceId) {
      // Ensure we don't leave the grievance stuck in AI_PENDING silently
      markAIFailed(job.data.grievanceId).catch(() => {});
    }
  });

  return worker;
}

async function processGrievance(grievanceId: string) {
  const start = Date.now();

  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
    include: { media: true, user: { select: { id: true, trustState: true } } },
  });

  if (!grievance) throw new Error(`Grievance ${grievanceId} not found`);
  if (grievance.status !== "AI_PENDING") {
    console.log(`[AIWorker] Grievance ${grievanceId} is not in AI_PENDING state, skipping`);
    return;
  }

  // ── Step 1: Text analysis ─────────────────────────────────────────────────
  const { raw: rawTextOutput, parsed: textAnalysis, promptVersion } =
    await analyzeGrievanceText(grievance.description, grievance.category);

  // ── Step 2: Image analysis (if photos attached) ──────────────────────────
  let imageAnalysisNote = "";
  const photos = grievance.media.filter((m: any) => m.type === "PHOTO");
  if (photos.length > 0) {
    try {
      const imageBuffers = photos
        .map((p: any) => {
          if (!fs.existsSync(p.storagePath)) return null;
          const data = fs.readFileSync(p.storagePath).toString("base64");
          return { data, mimeType: p.mimeType };
        })
        .filter(Boolean) as Array<{ data: string; mimeType: string }>;

      if (imageBuffers.length > 0) {
        imageAnalysisNote = await analyzeImages(imageBuffers, grievance.description);
      }
    } catch (err) {
      console.warn(`[AIWorker] Image analysis failed for grievance ${grievanceId}:`, err);
      // Continue without image analysis rather than failing the whole job
    }
  }

  // ── Step 3: Generate embedding for deduplication ──────────────────────────
  const embeddingText = `${textAnalysis.category} ${grievance.description} ${textAnalysis.summary}`;
  const embedding = await generateEmbedding(embeddingText);

  // ── Step 4: Save AI analysis record ──────────────────────────────────────
  const aiAnalysis = await prisma.aIAnalysis.create({
    data: {
      modelName: process.env.GEMINI_MODEL || "gemini-1.5-pro",
      modelVersion: "1.5-pro",
      promptVersion,
      category: textAnalysis.category,
      categoryConfidence: textAnalysis.categoryConfidence,
      severity: textAnalysis.severity,
      severityRationale: textAnalysis.severityRationale,
      authorityDepartment: textAnalysis.authorityDepartment,
      authorityConfidence: textAnalysis.authorityConfidence,
      overallConfidence: textAnalysis.overallConfidence,
      summary: textAnalysis.summary,
      needsClarification: textAnalysis.needsClarification,
      clarificationPrompt: textAnalysis.clarificationPrompt || null,
      evidenceFlags: textAnalysis.evidenceFlags as unknown as any,
      rawOutput: { textAnalysis: rawTextOutput, imageAnalysis: imageAnalysisNote } as any,
      inputArtifactIds: [grievanceId, ...grievance.media.map((m: any) => m.id)],
      processingMs: Date.now() - start,
    },
  });

  // ── Step 5: Link analysis to grievance ────────────────────────────────────
  await prisma.grievance.update({
    where: { id: grievanceId },
    data: { aiAnalysisId: aiAnalysis.id },
  });

  // ── Step 6: Issue clustering — find or create civic issue ─────────────────
  const { issue, isNew } = await createCivicIssueOrMerge({
    grievance,
    textAnalysis,
    embedding,
  });

  // ── Step 7: Link grievance to civic issue ─────────────────────────────────
  await prisma.grievance.update({
    where: { id: grievanceId },
    data: {
      civicIssueId: issue.id,
      status: isNew ? "NEW_ISSUE" : "MATCHED",
    },
  });

  // ── Step 8: Compute priority (for new issues or if this meaningfully changes priority) ──
  if (isNew) {
    await computePriority(issue.id, textAnalysis);
  }

  // ── Step 9: Route to authority ────────────────────────────────────────────
  if (isNew) {
    const routing = await routeToAuthority(issue.id, textAnalysis.authorityDepartment);
    if (routing) {
      // Enqueue notification to official
      await notificationQueue.add("notifyOfficial", {
        issueId: issue.id,
        officialId: routing.officialId,
      }, {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
      });

      // Start SLA clock
      await slaQueue.add("startSLA", {
        issueId: issue.id,
        severity: textAnalysis.severity,
      }, {
        attempts: 3,
      });
    }
  }

  // ── Step 10: Update grievance to ROUTED ────────────────────────────────────
  await prisma.grievance.update({
    where: { id: grievanceId },
    data: { status: "ROUTED" },
  });

  console.log(`[AIWorker] Grievance ${grievanceId} processed in ${Date.now() - start}ms → issue ${issue.id} (${isNew ? "NEW" : "MERGED"})`);
}

async function markAIFailed(grievanceId: string) {
  // Store in AI_PENDING — do not silently route. Operator must intervene.
  // This satisfies R6 (AI provider outage risk).
  await prisma.grievance.updateMany({
    where: { id: grievanceId, status: "AI_PENDING" },
    data: { status: "AI_PENDING" }, // Keep state, don't change
  });
  console.error(`[AIWorker] Grievance ${grievanceId} left in AI_PENDING after all retries — manual review required`);
}
