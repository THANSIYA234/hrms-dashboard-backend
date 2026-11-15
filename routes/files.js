import express from "express";
import path from "node:path";
import fs from "node:fs";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const UPLOAD_DIR = path.resolve("uploads/profilePics");

// `path.basename` strips any directory component, and the charset whitelist
// blocks traversal, null bytes and double extensions. UUIDs are what
// middleware/upload.js writes now; the wider charset keeps pre-existing
// `Date.now()+ext` rows from 404ing.
const SAFE_FILENAME = /^[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png)$/i;

router.get("/profilePics/:filename", authMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename);

  if (!SAFE_FILENAME.test(filename)) {
    return res.status(400).json({
      error: { code: "BAD_FILENAME", message: "Unsupported filename" },
    });
  }

  const absolute = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(absolute)) {
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }

  res.sendFile(absolute, { headers: { "Cache-Control": "private, max-age=300" } });
});

export default router;