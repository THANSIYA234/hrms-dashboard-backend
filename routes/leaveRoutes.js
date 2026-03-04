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

const router = express.Router();

//employee
router.post("/apply-leave", authMiddleware, applyLeave);
router.get("/my-history", authMiddleware, getLeavesHistory);
router.get("/my-leave/:id", authMiddleware, getLeaveById);
router.get("/balance-leave", authMiddleware, getBalanceLeave);
router.put("/update-leave/:id", authMiddleware, updateLeave);
router.delete("/delete-leave/:id", authMiddleware, deleteLeave);

//admin
router.get("/all-leaves", authMiddleware, getAllLeaves);
router.put("/status/:id", authMiddleware, authorizeRole("admin"), updateStatus);

export default router;
