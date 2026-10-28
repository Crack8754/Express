import { env } from "../config/env.js";

export function logger(req, res, next) {
  const start = performance.now();
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[env.LOG_LEVEL]) {
      console[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${Math.round(performance.now() - start)}ms requestId=${req.requestId}`);
    }
  });
  next();
}
