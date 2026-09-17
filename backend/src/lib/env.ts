import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-pro"),
  GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  STORAGE_BACKEND: z.enum(["local", "cloudinary"]).default("local"),
  UPLOAD_DIR: z.string().default("./uploads"),
  IDENTITY_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  JURISDICTION_NAME: z.string().default("Bengaluru Municipal Ward 42"),
  JURISDICTION_LAT: z.coerce.number().default(12.9716),
  JURISDICTION_LNG: z.coerce.number().default(77.5946),
  JURISDICTION_RADIUS_KM: z.coerce.number().default(10),
  SMS_MOCK: z.string().default("true"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("noreply@ecoconnect.in"),
});

export type Env = z.infer<typeof EnvSchema>;

let _env: Env | undefined;

export function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("[EcoConnect] Environment validation failed:");
    console.error(result.error.format());
    process.exit(1);
  }

  const env = result.data;

  if (env.NODE_ENV === "production" && !env.GEMINI_API_KEY) {
    console.error("[EcoConnect] GEMINI_API_KEY is required in production.");
    process.exit(1);
  }

  _env = env;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    return validateEnv();
  }
  return _env;
}
