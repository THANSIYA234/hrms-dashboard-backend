import express from "express";
import {
  createPunchIn,
  createPunchOut,
  getAttendanceHistory,
  getTodayAttendance,
} from "../controllers/attendance.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import {
  deleteAttendanceById,
  filterAttendanceByDate,
  getAllAttendance,
  getAttendanceByFilters,
  getAttendanceStats,
  getAttendanceTrend,
  getAttendendenceById,
  getTodayAttendanceSnapshot,
  getTotalWorkHours,
  getTotalWorkHoursByDate,
  getTotalWorkHoursByDepartment,
  getTotalWorkHoursByEmployee,
  updateAttendance,
} from "../controllers/admin.controller.js";

const router = express.Router();

//employee
router.post("/punch-in", authMiddleware, createPunchIn);
router.post("/punch-out", authMiddleware, createPunchOut);
router.get("/today-attendance", authMiddleware, getTodayAttendance);
router.get("/my-history", authMiddleware, getAttendanceHistory);

//admin
router.get("/", authMiddleware, getAllAttendance);
router.get("/filters", authMiddleware, getAttendanceByFilters);
router.get(
  "/today-snapshot",
  authMiddleware,

  getTodayAttendanceSnapshot,
);
router.get(
  "/employee/:id",
  authMiddleware,

  getAttendendenceById,
);

router.get(
  "/filter",
  authMiddleware,

  filterAttendanceByDate,
);

router.put(
  "/update/:id",
  authMiddleware,
  authorizeRole("admin"),
  updateAttendance,
);
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRole("admin"),
  deleteAttendanceById,
);

router.get(
  "/total-hours",
  authMiddleware,

  getTotalWorkHours,
);
router.get(
  "/total-hours/:employeeId",
  authMiddleware,

  getTotalWorkHoursByEmployee,
);
router.get(
  "/total-hours/department",
  authMiddleware,

  getTotalWorkHoursByDepartment,
);
router.get(
  "/total-hours/by-date",
  authMiddleware,

  getTotalWorkHoursByDate,
);

router.get(
  "/stats",
  authMiddleware,

  getAttendanceStats,
);
router.get(
  "/trends",
  authMiddleware,

  getAttendanceTrend,
);
export default router;
