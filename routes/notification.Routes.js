import express from "express";
import {
  getAllNotification,
  getUnreadCount,
  markAsRead,
} from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { notificationIdParamSchema } from "../validators/notification.schemas.js";

const router = express.Router();

// No POST route: `createNotification` in the controller is an internal helper
// (userId, title, message, type, link), not a request handler, and no client
// calls it.

router.get("/", authMiddleware, getAllNotification);
router.get("/unread-count/", authMiddleware, getUnreadCount);
router.put(
  "/:notificationId/read",
  authMiddleware,
  validate(notificationIdParamSchema, "params"),
  markAsRead,
);

export default router;