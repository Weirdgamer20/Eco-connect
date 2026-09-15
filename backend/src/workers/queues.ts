import { Queue } from "bullmq";
import { getRedis } from "../lib/redis";

const connection = getRedis();

/** AI analysis jobs */
export const aiQueue = new Queue("ai-analysis", { connection });

/** Notification jobs */
export const notificationQueue = new Queue("notifications", { connection });

/** SLA monitoring jobs */
export const slaQueue = new Queue("sla", { connection });

/** Resolution verification window jobs (delayed) */
export const verificationQueue = new Queue("verification", { connection });
