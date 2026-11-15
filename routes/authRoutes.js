import express from "express";
import {
  getAdminProfile,
  getMe,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
} from "../controllers/auth.controller.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { loginSchema, registerSchema } from "../validators/auth.schemas.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  authMiddleware,
  authorizeRole("admin"),
  validate(registerSchema),
  registerUser,
);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);
router.get("/profile", authMiddleware, getAdminProfile);

export default router;