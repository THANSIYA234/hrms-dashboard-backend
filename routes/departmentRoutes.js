import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import {
  assignDepartmentSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validators/department.schemas.js";
import {
  assignDepartment,
  assignDepartmentHead,
  createDepartment,
  deletedDepartment,
  getDepartment,
  getDepartmentById,
  getDepartmentEmployeeStats,
  getEmployeeByDepartment,
  updateDepartment,
} from "../controllers/department.controller.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRole("admin"),
  validate(createDepartmentSchema),
  createDepartment,
);
router.get("/", authMiddleware, getDepartment);

// specific routes must be defined before the param route
router.get("/stats", authMiddleware, getDepartmentEmployeeStats);

router.post(
  "/assign",
  authMiddleware,
  authorizeRole("admin"),
  validate(assignDepartmentSchema),
  assignDepartment,
);

router.post(
  "/assign-head",
  authMiddleware,
  authorizeRole("admin"),
  validate(assignDepartmentSchema),
  assignDepartmentHead,
);

router.get(
  "/:id/employees",
  authMiddleware,
  validate(idParamSchema, "params"),
  getEmployeeByDepartment,
);

// param routes last
router.get("/:id", authMiddleware, validate(idParamSchema, "params"), getDepartmentById);
router.put(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  validate(idParamSchema, "params"),
  validate(updateDepartmentSchema),
  updateDepartment,
);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  validate(idParamSchema, "params"),
  deletedDepartment,
);

export default router;