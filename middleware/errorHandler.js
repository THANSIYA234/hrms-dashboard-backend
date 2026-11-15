import { z, ZodError } from "zod";
import { isProd } from "../config/cookies.js";

/**
 * Terminal error middleware. Express 5 forwards rejected promises from async
 * handlers here automatically, so no try/catch wrapper library is needed.
 * Shape is always `{ error: { code, message } }` so clients can branch on a
 * stable code instead of parsing prose.
 */
export const errorHandler = (err, req, res, _next) => {
  req.log?.error({ err }, "unhandled request error");

  if (res.headersSent) return;

  if (err instanceof ZodError || err.name === "ZodError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: z.flattenError(err),
      },
    });
  }

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: { code: "DB_VALIDATION", message: "Document validation failed" },
    });
  }

  // Malformed ObjectId in a path/query
  if (err.name === "CastError") {
    return res.status(400).json({
      error: { code: "BAD_ID", message: "Malformed identifier" },
    });
  }

  // Unique index violation
  if (err.code === 11000) {
    return res.status(409).json({
      error: { code: "DUPLICATE_KEY", message: "Resource already exists" },
    });
  }

  // Multer rejections
  if (err.name === "MulterError") {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({
      error: {
        code: tooBig ? "FILE_TOO_LARGE" : "UPLOAD_REJECTED",
        message: tooBig ? "File exceeds the 2MB limit" : "Invalid upload",
      },
    });
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: isProd ? "Internal error" : err.message,
    },
  });
};

export default errorHandler;