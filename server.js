// `dotenv/config` is imported first so .env is populated before any module
// reads process.env at load time.
import "dotenv/config";

import mongoose from "mongoose";
import app, { logger } from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

let server;

async function bootstrap() {
  await connectDB();
  server = app.listen(PORT, () => logger.info({ port: PORT }, "server started"));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "bootstrap failed");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  process.exit(1);
});

const shutdown = (signal) => {
  logger.info({ signal }, "shutting down");

  const forceExit = setTimeout(() => {
    logger.error("forcing shutdown after timeout");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server?.close(async () => {
    await mongoose.connection.close();
    clearTimeout(forceExit);
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;