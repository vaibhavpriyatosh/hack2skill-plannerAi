import pino from "pino";
import { getEnv } from "@/lib/env";

const env = getEnv();

export const logger = pino({
  name: "next-fullstack-app",
  level: env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "token", "secret"],
    remove: true,
  },
  base: {
    env: env.NODE_ENV,
  },
});
