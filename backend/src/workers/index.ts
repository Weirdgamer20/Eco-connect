import { startAIWorker } from "./ai.worker";
import { startNotificationWorker } from "./notification.worker";
import { startSLAWorker } from "./sla.worker";
import { startVerificationWorker } from "./verification.worker";

export function startWorkers() {
  console.log("[Workers] Starting background workers...");
  startAIWorker();
  startNotificationWorker();
  startSLAWorker();
  startVerificationWorker();
  console.log("[Workers] All workers started.");
}
