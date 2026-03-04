import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    role: {
      type: String,
      enum: ["employee", "admin", "all"],
      default: "employee",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    type: {
      type: String,
      enum: ["leave", "salary", "announcement", "system"],
      default: "system",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
