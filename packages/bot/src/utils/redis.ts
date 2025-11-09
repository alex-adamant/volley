import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL!;

export const redis = new Redis(REDIS_URL);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (e) => console.error("❌ Redis error:", e.message));
