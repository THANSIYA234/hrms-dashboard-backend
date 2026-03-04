import express from "express";
import {
  createPunchIn,
  createPunchOut,
  getAttendenceHistory,
  getTodayAttendence,
} from "../controllers/attendence.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import {
  deleteAttendenceById,
  filterAttendenceByDate,
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
  updateAttendence,
} from "../controllers/admin.controller.js";

const router = express.Router();

//employee
router.post("/punch-in", authMiddleware, createPunchIn);
router.post("/punch-out", authMiddleware, createPunchOut);
router.get("/today-attendance", authMiddleware, getTodayAttendence);
router.get("/my-history", authMiddleware, getAttendenceHistory);

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

  filterAttendenceByDate,
);

router.put(
  "/update/:id",
  authMiddleware,
  authorizeRole("admin"),
  updateAttendence,
);
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRole("admin"),
  deleteAttendenceById,
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
