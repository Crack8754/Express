import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAX_EVENTS: z.coerce.number().int().positive().default(100)
});
const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = result.data;
