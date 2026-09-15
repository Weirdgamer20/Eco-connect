import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../middleware/errorHandler";
import { getEnv } from "./env";

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/3gpp",
]);

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB per image
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB per video (spec requirement)

/** Ensure upload directory exists */
function ensureUploadDir(): string {
  const env = getEnv();
  const dir = path.resolve(env.UPLOAD_DIR, "quarantine");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Multer storage — quarantine location before validation */
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, ensureUploadDir());
  },
  filename(_req, file, cb) {
    // Never use user-supplied filename. Generate a UUID-based internal name.
    const { v4: uuidv4 } = require("uuid");
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "");
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use video max as ceiling; image enforcement happens in validation
    files: 3, // max 2 photos + 1 video
  },
  fileFilter(_req, file, cb) {
    // Basic MIME check at intake (not trusted; real validation happens after upload)
    const allAllowed = new Set([...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES]);
    if (!allAllowed.has(file.mimetype)) {
      return cb(new AppError(415, "UNSUPPORTED_MEDIA_TYPE", `File type ${file.mimetype} is not allowed.`));
    }
    cb(null, true);
  },
});

/**
 * Validates an uploaded file by reading its magic bytes.
 * This is the authoritative validation — MIME from client is not trusted.
 */
export async function validateUploadedFile(
  filePath: string,
  declaredFieldName: string
): Promise<{ mimeType: string; isImage: boolean; isVideo: boolean }> {
  const buffer = fs.readFileSync(filePath);
  const { fileTypeFromBuffer } = await (Function('return import("file-type")')() as Promise<typeof import("file-type")>);
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    fs.unlinkSync(filePath);
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Could not determine file type. Please upload a valid image or video.");
  }

  const isImage = ALLOWED_IMAGE_MIMES.has(detected.mime);
  const isVideo = ALLOWED_VIDEO_MIMES.has(detected.mime);

  if (!isImage && !isVideo) {
    fs.unlinkSync(filePath);
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", `File type ${detected.mime} is not allowed.`);
  }

  // Enforce per-type size limits
  const stats = fs.statSync(filePath);
  if (isImage && stats.size > MAX_IMAGE_SIZE) {
    fs.unlinkSync(filePath);
    throw new AppError(413, "FILE_TOO_LARGE", "Image must be under 15 MB.");
  }

  if (isVideo && stats.size > MAX_VIDEO_SIZE) {
    fs.unlinkSync(filePath);
    throw new AppError(413, "FILE_TOO_LARGE", "Video must be under 50 MB.");
  }

  return { mimeType: detected.mime, isImage, isVideo };
}

/**
 * Moves a validated file from quarantine to permanent storage.
 */
export function moveToStorage(quarantinePath: string, filename: string): string {
  const env = getEnv();
  const destDir = path.resolve(env.UPLOAD_DIR, "media");
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const destPath = path.join(destDir, filename);
  fs.renameSync(quarantinePath, destPath);
  return destPath;
}

/**
 * Returns a public URL for a stored file.
 */
export function getPublicUrl(storagePath: string): string {
  const env = getEnv();
  const filename = path.basename(storagePath);
  return `${process.env.NEXT_PUBLIC_API_URL || `http://localhost:${env.PORT}`}/uploads/media/${filename}`;
}

/**
 * Cleans up files from quarantine if processing fails.
 */
export function cleanupFiles(paths: string[]): void {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      // Best-effort cleanup
    }
  }
}
