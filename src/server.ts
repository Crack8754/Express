import { env } from "./config/env.js";
import app from "./app.js";

const server = app.listen(env.PORT);
server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(error.code === "EADDRINUSE"
    ? `Port ${env.PORT} is already in use. Stop the running server before starting another one.`
    : "Server failed to start");
  process.exitCode = 1;
});
server.on("listening", () => {
  console.log(`CampusHub API running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
