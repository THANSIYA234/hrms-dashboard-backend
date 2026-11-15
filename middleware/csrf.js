import crypto from "node:crypto";
import { csrfCookieOptions } from "../config/cookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// These endpoints mint the session, so there is no token to check yet; they are
// not attacker-forged in any meaningful way (login needs credentials, refresh
// and logout only act on the caller's own cookies).
const EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Mints a CSRF token, writes it to a JS-readable cookie and returns it so the
 * caller can also hand it to the client in the JSON body. The body copy is what
 * makes this work cross-origin: `document.cookie` cannot read a cookie set by
 * a different registrable domain (netlify.app -> onrender.com), but the
 * double-submit comparison still holds because the browser sends the cookie and
 * only same-origin JS can learn its value.
 */
export const issueCsrfToken = (res) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("XSRF-TOKEN", token, csrfCookieOptions());
  return token;
};

export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies?.["XSRF-TOKEN"];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({
      error: { code: "CSRF_TOKEN_INVALID" },
    });
  }

  next();
};

export default csrfProtection;