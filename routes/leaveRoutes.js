import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  applyLeave,
  deleteLeave,
  getAllLeaves,
  getBalanceLeave,
  getLeaveById,
  getLeavesHistory,
  updateLeave,
  updateStatus,
} from "../controllers/leave.controller.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, paginationSchema } from "../validators/common.js";
import {
  applyLeaveSchema,
  listLeavesQuerySchema,
  updateLeaveSchema,
  updateStatusSchema,
} from "../validators/leave.schemas.js";

const router = express.Router();

//employee
router.post("/apply-leave", authMiddleware, validate(applyLeaveSchema), applyLeave);
router.get(
  "/my-history",
  authMiddleware,
  validate(paginationSchema, "query"),
  getLeavesHistory,
);
router.get(
  "/my-leave/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  getLeaveById,
);
router.get("/balance-leave", authMiddleware, getBalanceLeave);
router.put(
  "/update-leave/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  validate(updateLeaveSchema),
  updateLeave,
);
router.delete(
  "/delete-leave/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  deleteLeave,
);

//admin
router.get(
  "/all-leaves",
  authMiddleware,
  validate(listLeavesQuerySchema, "query"),
  getAllLeaves,
);
router.put(
  "/status/:id",
  authMiddleware,
  authorizeRole("admin"),
  validate(idParamSchema, "params"),
  validate(updateStatusSchema),
  updateStatus,
);

export default router;