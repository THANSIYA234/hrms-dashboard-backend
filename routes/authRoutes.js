import express from "express";
import {
  getAdminProfile,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
} from "../controllers/auth.controller.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/register", authMiddleware, authorizeRole("admin"), registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.get("/profile", authMiddleware, getAdminProfile);
export default router;
