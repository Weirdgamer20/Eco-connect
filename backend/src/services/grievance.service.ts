import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { aiQueue } from "../workers/queues";
import {
  validateUploadedFile,
  moveToStorage,
  getPublicUrl,
  cleanupFiles,
} from "../lib/upload";
import path from "path";
import type { CreateGrievanceDto } from "@ecoconnect/types";

/** Maximum files per grievance */
const MAX_PHOTOS = 2;
const MAX_VIDEOS = 1;

/**
 * Creates a new grievance with idempotency protection.
 * After creation, enqueues the AI analysis job.
 */
export async function createGrievance(userId: string, dto: CreateGrievanceDto) {
  // Idempotency: if a grievance with this key already exists for this user, return it
  const existing = await prisma.grievance.findFirst({
    where: { idempotencyKey: dto.idempotencyKey, userId },
    include: { media: true },
  });
  if (existing) {
    return { grievance: existing, created: false };
  }

  const grievance = await prisma.grievance.create({
    data: {
      idempotencyKey: dto.idempotencyKey,
      userId,
      category: dto.category,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      anonymous: dto.anonymous ?? false,
      status: "SUBMITTED",
    },
  });

  return { grievance, created: true };
}

/**
 * Attaches uploaded media files to a grievance.
 * Validates file types and limits, then moves to permanent storage.
 */
export async function attachMedia(
  grievanceId: string,
  userId: string,
  files: Express.Multer.File[]
) {
  // Ownership check
  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
    include: { media: true },
  });

  if (!grievance || grievance.userId !== userId) {
    cleanupFiles(files.map((f) => f.path));
    throw new AppError(404, "NOT_FOUND", "Grievance not found.");
  }

  if (grievance.status !== "SUBMITTED" && grievance.status !== "DRAFT") {
    cleanupFiles(files.map((f) => f.path));
    throw new AppError(409, "GRIEVANCE_LOCKED", "Cannot add media to a grievance that is already being processed.");
  }

  const existingPhotos = grievance.media.filter((m: any) => m.type === "PHOTO").length;
  const existingVideos = grievance.media.filter((m: any) => m.type === "VIDEO").length;

  const quarantinePaths: string[] = [];
  const mediaRecords: Array<{
    grievanceId: string;
    type: "PHOTO" | "VIDEO";
    originalName: string;
    storagePath: string;
    publicUrl: string;
    mimeType: string;
    sizeBytes: number;
  }> = [];

  let newPhotos = 0;
  let newVideos = 0;

  for (const file of files) {
    quarantinePaths.push(file.path);

    const { mimeType, isImage, isVideo } = await validateUploadedFile(file.path, file.fieldname);

    if (isImage) {
      if (existingPhotos + newPhotos >= MAX_PHOTOS) {
        cleanupFiles(quarantinePaths);
        throw new AppError(422, "TOO_MANY_PHOTOS", `Maximum ${MAX_PHOTOS} photos allowed per grievance.`);
      }
      newPhotos++;
    }

    if (isVideo) {
      if (existingVideos + newVideos >= MAX_VIDEOS) {
        cleanupFiles(quarantinePaths);
        throw new AppError(422, "TOO_MANY_VIDEOS", `Maximum ${MAX_VIDEOS} video allowed per grievance.`);
      }
      newVideos++;
    }

    const filename = path.basename(file.path);
    const storagePath = moveToStorage(file.path, filename);
    const publicUrl = getPublicUrl(storagePath);

    mediaRecords.push({
      grievanceId,
      type: isImage ? "PHOTO" : "VIDEO",
      originalName: file.originalname.slice(0, 255), // Truncate, never trust full input
      storagePath,
      publicUrl,
      mimeType,
      sizeBytes: file.size,
    });
  }

  const createdMedia = await prisma.mediaFile.createMany({ data: mediaRecords });

  return { attached: createdMedia.count };
}

/**
 * Finalizes a grievance submission — transitions to AI_PENDING and enqueues AI job.
 */
export async function finalizeGrievance(grievanceId: string, userId: string) {
  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
    include: { media: true },
  });

  if (!grievance || grievance.userId !== userId) {
    throw new AppError(404, "NOT_FOUND", "Grievance not found.");
  }

  if (grievance.status !== "SUBMITTED") {
    throw new AppError(409, "INVALID_STATE", "Grievance cannot be finalized from its current state.");
  }

  // Transition to AI_PENDING
  const updated = await prisma.grievance.update({
    where: { id: grievanceId },
    data: { status: "AI_PENDING" },
    include: { media: true },
  });

  // Enqueue AI analysis job
  await aiQueue.add("analyzeGrievance", { grievanceId }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: { age: 7 * 24 * 3600 },
  });

  return updated;
}

/**
 * Returns a citizen's own grievances (paginated).
 */
export async function getMyGrievances(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.grievance.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        media: { select: { id: true, type: true, publicUrl: true } },
        civicIssue: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
    }),
    prisma.grievance.count({ where: { userId } }),
  ]);

  return { items, total, page, limit };
}
