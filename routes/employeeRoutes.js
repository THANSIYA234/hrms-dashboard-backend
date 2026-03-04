import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  changePassword,
  createEmployee,
  deleteEmployeeById,
  getEmployeeById,
  getEmployees,
  ProfileView,
  updateEmployeeById,
  updateProfile,
} from "../controllers/employee.controller.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();
router.post(
  "/",
  authMiddleware,
  authorizeRole("admin"),
  upload.single("profileImage"),
  createEmployee,
);
router.get("/profile", authMiddleware, ProfileView);
router.put(
  "/update-Profile",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile,
);
router.put("/change-password", authMiddleware, changePassword);
router.get("/", authMiddleware, getEmployees);
router.get("/:id", authMiddleware, getEmployeeById);
router.put(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  upload.single("profileImage"),
  updateEmployeeById,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  deleteEmployeeById,
);

export default router;
