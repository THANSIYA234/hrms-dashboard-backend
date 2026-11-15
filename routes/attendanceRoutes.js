import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleWare.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, employeeIdParamSchema } from "../validators/common.js";
import {
  attendanceFilterQuerySchema,
  attendanceListQuerySchema,
  filtersQuerySchema,
  punchSchema,
  trendQuerySchema,
  updateAttendanceSchema,
  workHoursByDateQuerySchema,
} from "../validators/attendance.schemas.js";
import {
  createPunchIn,
  createPunchOut,
  getAttendanceHistory,
  getTodayAttendance,
} from "../controllers/attendance.controller.js";
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
router.post("/punch-in", authMiddleware, validate(punchSchema), createPunchIn);
router.post(
  "/punch-out",
  authMiddleware,
  validate(punchSchema),
  createPunchOut,
);
router.get("/today-attendance", authMiddleware, getTodayAttendance);
router.get("/my-history", authMiddleware, getAttendanceHistory);

//admin
router.get(
  "/",
  authMiddleware,
  validate(attendanceListQuerySchema, "query"),
  getAllAttendance,
);
router.get(
  "/filters",
  authMiddleware,
  validate(filtersQuerySchema, "query"),
  getAttendanceByFilters,
);
router.get(
  "/today-snapshot",
  authMiddleware,
  validate(filtersQuerySchema, "query"),
  getTodayAttendanceSnapshot,
);
router.get(
  "/employee/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  getAttendendenceById,
);
router.get(
  "/filter",
  authMiddleware,
  validate(attendanceFilterQuerySchema, "query"),
  filterAttendanceByDate,
);
router.put(
  "/update/:id",
  authMiddleware,
  authorizeRole("admin"),
  validate(idParamSchema, "params"),
  validate(updateAttendanceSchema),
  updateAttendance,
);
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRole("admin"),
  validate(idParamSchema, "params"),
  deleteAttendanceById,
);

router.get("/total-hours", authMiddleware, getTotalWorkHours);
// Literal paths must precede the param route, otherwise `/total-hours/department`
// is captured as employeeId="department".
router.get("/total-hours/department", authMiddleware, getTotalWorkHoursByDepartment);
router.get(
  "/total-hours/by-date",
  authMiddleware,
  validate(workHoursByDateQuerySchema, "query"),
  getTotalWorkHoursByDate,
);
router.get(
  "/total-hours/:employeeId",
  authMiddleware,
  validate(employeeIdParamSchema, "params"),
  getTotalWorkHoursByEmployee,
);

router.get("/stats", authMiddleware, getAttendanceStats);
router.get(
  "/trends",
  authMiddleware,
  validate(trendQuerySchema, "query"),
  getAttendanceTrend,
);

export default router;