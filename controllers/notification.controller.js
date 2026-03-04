import Notification from "../models/notification.js";

export const createNotification = async (
  userId,
  title,
  message,
  type = "system",
  link,
) => {
  return await Notification.create({
    user: userId,
    title,
    message,
    type,
    link,
    isRead: false,
  });
};

//get all notifications for a user
export const getAllNotification = async (req, res) => {
  try {
    const userId = req.user.employeeId;
    const role = req.user.role;

    const notifications = await Notification.find({
      $or: [{ user: userId }, { role: role }, { role: "all" }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//mark a notification as read
export const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }
  notification.isRead = true;
  await notification.save();
  res.status(200).json({ message: "Notification marked as read" });
};
export const getUnreadCount = async (req, res) => {
  const { user } = req;

  let count;

  if (user.role === "admin") {
    // Admins get ALL unread admin notifications
    count = await Notification.countDocuments({
      role: "admin",
      isRead: false,
    });
  } else {
    // Employees get their own notifications
    count = await Notification.countDocuments({
      user: user.employeeId,
      isRead: false,
    });
  }

  res.json({ count });
};
