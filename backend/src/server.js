import { app } from "./app.js";
import { ensureRuntimeSchema } from "./db/ensureSchema.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

await ensureRuntimeSchema();

const server = app.listen(env.PORT, () => {
  logger.info(`FitSphere API listening on http://localhost:${env.PORT}/api/${env.API_VERSION}`);
});

function shutdown(signal) {
  logger.info({ signal }, "Shutting down FitSphere API");
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  process.exit(1);
});
