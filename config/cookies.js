export const isProd = process.env.NODE_ENV === "production";

export const ACCESS_TTL_MS = 15 * 60 * 1000; // 15m
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7d

// The frontend is served from a different registrable domain than the API
// (netlify.app -> onrender.com), so cookies must be SameSite=None + Secure in
// production. `Secure` is impossible over plain http, hence `lax` in dev.
// Cross-site cookie auth is what makes the CSRF token mandatory.
export const cookieOptions = (path) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path,
});

export const csrfCookieOptions = () => ({
  httpOnly: false, // the client echoes this value back in a header
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
});