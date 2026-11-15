import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const UPLOAD_DIR = path.resolve("uploads/profilePics");
const MAX_BYTES = 2 * 1024 * 1024;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Declared type -> the only extension we will ever write for it.
const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const reject = (code, message) => {
  const err = new Error(message);
  err.status = 400;
  err.code = code;
  return err;
};

/**
 * The declared mimetype is attacker-controlled, so the real check is the
 * file's magic bytes. Returns the sniffed type, or null.
 */
const sniffImageType = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "image/png";
  }
  return null;
};

const receive = multer({
  // Files are buffered so magic bytes can be inspected before anything is
  // written to disk.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) {
      return cb(reject("INVALID_FILE_TYPE", "Only JPG, JPEG and PNG images are allowed"));
    }
    cb(null, true);
  },
}).single("profileImage");

/**
 * Accepts an optional `profileImage` file, verifies its real content type and
 * persists it under a random UUID name. Normalises `req.file.path` /
 * `req.file.filename` so controllers can keep storing the same relative path
 * they always did.
 */
export const upload = (req, res, next) =>
  receive(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    const sniffed = sniffImageType(req.file.buffer);
    if (!sniffed) {
      return next(
        reject("INVALID_FILE_TYPE", "File content is not a valid JPG or PNG image"),
      );
    }

    const filename = `${crypto.randomUUID()}${EXT_BY_MIME[sniffed]}`;
    const absolute = path.join(UPLOAD_DIR, filename);

    try {
      fs.writeFileSync(absolute, req.file.buffer, { flag: "wx" });
    } catch (writeErr) {
      return next(writeErr);
    }

    req.file.filename = filename;
    req.file.path = `uploads/profilePics/${filename}`;
    next();
  });