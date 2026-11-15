import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["employee", "manager", "admin"],
      default: "employee",
    },

    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

    // SHA-256 of the refresh token; the raw token only ever exists in the
    // client's httpOnly cookie.
    refreshTokenHash: { type: String, default: null },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);