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
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import {
  changePasswordSchema,
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateProfileSchema,
} from "../validators/employee.schemas.js";

const router = express.Router();

// `upload` runs before `validate` so multipart text fields are parsed.
router.post(
  "/",
  authMiddleware,
  authorizeRole("admin"),
  upload,
  validate(createEmployeeSchema),
  createEmployee,
);
router.get("/profile", authMiddleware, ProfileView);
router.put(
  "/update-Profile",
  authMiddleware,
  upload,
  validate(updateProfileSchema),
  updateProfile,
);
router.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  changePassword,
);
router.get("/", authMiddleware, validate(listEmployeesQuerySchema, "query"), getEmployees);
router.get(
  "/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  getEmployeeById,
);
router.put(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  upload,
  validate(idParamSchema, "params"),
  validate(updateEmployeeSchema),
  updateEmployeeById,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  validate(idParamSchema, "params"),
  deleteEmployeeById,
);

export default router;