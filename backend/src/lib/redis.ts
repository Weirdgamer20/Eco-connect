import IORedis from "ioredis";
import { getEnv } from "./env";

let _redis: IORedis | undefined;

export function getRedis(): IORedis {
  if (!_redis) {
    const env = getEnv();
    _redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
    });

    _redis.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });

    _redis.on("connect", () => {
      console.log("[Redis] connected");
    });
  }
  return _redis;
}
