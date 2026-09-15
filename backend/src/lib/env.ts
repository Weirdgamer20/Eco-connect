import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/ecoconnect"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().default("ecoconnect_super_secret_jwt_key_at_least_32_characters_long_2026"),
  JWT_REFRESH_SECRET: z.string().default("ecoconnect_super_secret_refresh_jwt_key_32_chars_2026"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().default("mock_gemini_api_key_development"),
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
    console.error("[EcoConnect] ❌ Environment validation failed:");
    console.error(result.error.format());
    process.exit(1);
  }
  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    return validateEnv();
  }
  return _env;
}
