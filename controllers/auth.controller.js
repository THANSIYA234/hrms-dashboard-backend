import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import {
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
  cookieOptions,
} from "../config/cookies.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// Compared against when no user matches, so a missing account costs the same
// wall-clock as a wrong password and cannot be told apart by timing.
const DUMMY_HASH = "$2b$10$DA/WAiRBmQCoZ.Uz0tH/Yu4MvThVLCPxtRP7/nUZOcsKfDJ5q3RoG";

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  employeeId: user.employeeId ?? null,
});

const signAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      employeeId: user.employeeId ?? undefined,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

const signRefreshToken = (user) =>
  jwt.sign(
    // `jti` is what makes rotation real: a JWT signed with only {id, exp, iat}
    // is byte-identical for every issuance within the same second, so the
    // previous token would stay valid and replay detection would never fire.
    { id: user._id, jti: crypto.randomBytes(16).toString("hex") },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" },
  );

const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = sha256(refreshToken);
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  res.cookie("accessToken", accessToken, {
    ...cookieOptions("/api"),
    maxAge: ACCESS_TTL_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions("/api/auth"),
    maxAge: REFRESH_TTL_MS,
  });

  return { user: publicUser(user), csrfToken: issueCsrfToken(res) };
};

// create user — admin only (enforced by authorizeRole("admin") on the route)
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    // `role` is only honoured because this route is admin-gated and the value
    // is constrained by the zod enum; it never comes from a self-service body.
    role: role ?? "employee",
  });

  return res.status(201).json({
    message: "user created",
    userWithoutPassword: publicUser(user),
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const matched = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  // One branch for "no such user", "wrong password" and "still locked" keeps
  // the response byte-identical so the endpoint cannot be used to enumerate
  // accounts. A correct password during a lock window still gets the explicit
  // 423, which reveals nothing to someone without the password.
  if (!user || !matched) {
    if (user) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await user.save();
    }

    return res.status(401).json({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    return res.status(423).json({
      error: { code: "ACCOUNT_LOCKED", message: "Account temporarily locked" },
    });
  }

  const session = await issueSession(res, user);
  return res.json(session);
};

// rotate refresh token -> new access token
export const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      error: { code: "NO_REFRESH_TOKEN", message: "Session expired" },
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.REFRESH_SECRET);
  } catch (_err) {
    return res.status(401).json({
      error: { code: "INVALID_REFRESH_TOKEN", message: "Session expired" },
    });
  }

  const user = await User.findOne({
    _id: payload.id,
    refreshTokenHash: sha256(token),
  });

  if (!user) {
    // Hash mismatch on a structurally valid token means a rotated token was
    // replayed. Drop the session instead of trying to salvage it.
    await User.findByIdAndUpdate(payload.id, { refreshTokenHash: null });
    return res.status(401).json({
      error: { code: "INVALID_REFRESH_TOKEN", message: "Session expired" },
    });
  }

  const session = await issueSession(res, user);
  return res.json(session);
};

export const logoutUser = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (_err) {
      payload = null;
    }
    if (payload) {
      await User.findByIdAndUpdate(payload.id, { refreshTokenHash: null });
    }
  }

  res.clearCookie("accessToken", cookieOptions("/api"));
  res.clearCookie("refreshToken", cookieOptions("/api/auth"));
  res.clearCookie("XSRF-TOKEN", { path: "/" });

  return res.json({ message: "Logged out" });
};

/**
 * Identity straight from the verified token — no database round trip.
 *
 * Also echoes the CSRF token back so a freshly loaded page can seed the value
 * it sends in `X-CSRF-Token`: cross-origin the frontend cannot read the
 * cookie itself, but the browser still sends it on every request.
 */
export const getMe = (req, res) =>
  res.json({
    user: {
      id: req.user.id,
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      employeeId: req.user.employeeId,
    },
    csrfToken: req.cookies?.["XSRF-TOKEN"] ?? null,
  });

export const getAdminProfile = async (req, res) => {
  const admin = await User.findById(req.user._id).select(
    "-password -refreshTokenHash",
  );

  if (!admin) {
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }

  return res.json(admin);
};