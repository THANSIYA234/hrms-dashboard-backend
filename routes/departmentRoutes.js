import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
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

router.post("/", authMiddleware, authorizeRole("admin"), createDepartment);
router.get("/", authMiddleware, getDepartment);

// specific routes must be defined before the param route
router.get(
  "/stats",
  authMiddleware,

  getDepartmentEmployeeStats,
);

router.post(
  "/assign",
  authMiddleware,
  authorizeRole("admin"),
  assignDepartment,
);

router.post(
  "/assign-head",
  authMiddleware,
  authorizeRole("admin"),
  assignDepartmentHead,
);

router.get(
  "/:id/employees",
  authMiddleware,

  getEmployeeByDepartment,
);

// param route last
router.get("/:id", authMiddleware, getDepartmentById);
router.put("/:id", authMiddleware, authorizeRole("admin"), updateDepartment);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  deletedDepartment,
);

export default router;
