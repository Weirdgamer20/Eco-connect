import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { validateEnv } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalRateLimiter } from "./middleware/rateLimit";
import { authRouter } from "./routes/auth";
import { grievanceRouter } from "./routes/grievances";
import { issueRouter } from "./routes/issues";
import { officialRouter } from "./routes/official";
import { notificationRouter } from "./routes/notifications";
import { profileRouter } from "./routes/profile";
import { startWorkers } from "./workers";
import { auditLogger } from "./middleware/auditLogger";

// Validate all required environment variables at startup.
// Fail fast rather than silently running with missing config.
validateEnv();

const app = express();

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(globalRateLimiter);

// ─── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan("combined"));

// ─── Audit logging (request-level events) ────────────────────────────────────
app.use(auditLogger);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/grievances", grievanceRouter);
app.use("/issues", issueRouter);
app.use("/official", officialRouter);
app.use("/notifications", notificationRouter);
app.use("/profile", profileRouter);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`[EcoConnect API] listening on port ${PORT}`);
  startWorkers();
});

export default app;
