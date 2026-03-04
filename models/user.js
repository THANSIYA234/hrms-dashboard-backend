import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["employee", "manager", "admin"],
      default: "employee",
    },

    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

    refreshToken: { type: String },
  },
  { timestamps: true },
);
export default mongoose.model("User", userSchema);
