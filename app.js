import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import pino from "pino";
import pinoHttp from "pino-http";

import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import notificationRoutes from "./routes/notification.Routes.js";
import healthRoutes from "./routes/health.js";
import fileRoutes from "./routes/files.js";

import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiters.js";

export const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "test" ? "silent" : "info"),
  // Never let credentials or personal data reach the log sink.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.oldPassword",
      "req.body.newPassword",
    ],
    censor: "[redacted]",
  },
});

export const app = express();

// Render/Railway terminate TLS at the proxy; without this, express-rate-limit
// sees the proxy's IP and every client shares one bucket.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/healthz" },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

app.use(
  helmet({
    // The frontend is served from a different origin than the API and loads
    // profile images from /api/files. helmet defaults this header to
    // "same-origin", which makes Chromium refuse the image outright
    // (net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());

app.use(
  cors({
    origin: (
      process.env.CORS_ORIGINS || "https://hrmsdashboardfrontend.netlify.app"
    )
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(csrfProtection);
app.use(generalLimiter);

app.use(healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/notifications", notificationRoutes);
// Replaces the former public `app.use("/uploads", express.static("uploads"))`.
app.use("/api/files", fileRoutes);

app.use(errorHandler);

export default app;
