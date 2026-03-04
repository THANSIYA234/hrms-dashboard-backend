import Express from "express";
import {
  createNotification,
  getAllNotification,
  getUnreadCount,
  markAsRead,
} from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Express.Router();

router.post("/", authMiddleware, createNotification);
router.get("/", authMiddleware, getAllNotification);
router.get("/unread-count/", authMiddleware, getUnreadCount);
router.put("/:notificationId/read", authMiddleware, markAsRead);

export default router;
