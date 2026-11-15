import jwt from "jsonwebtoken";

/**
 * Reads the access token from the httpOnly cookie (Phase 1 replaced the
 * Authorization header so the token is never reachable from JS).
 *
 * The JWT payload is already signed, so there is no per-request `User` lookup.
 * `_id` is mirrored onto the payload because controllers written against the
 * old hydrated User document still read `req.user._id`.
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      error: { code: "NO_TOKEN", message: "Authentication required" },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      _id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      employeeId: decoded.employeeId ?? null,
    };

    next();
  } catch (_err) {
    res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Session expired" },
    });
  }
};

export default authMiddleware;