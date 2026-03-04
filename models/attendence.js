import mongoose from "mongoose";

const attendenceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    punchIn: { type: Date },
    punchOut: { type: Date },
    workHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Present", "Half-Day", "Completed", "Absent", "On Leave", "Late"],
      default: "Present",
    },
  },
  { timestamps: true },
);

const Attendence = mongoose.model("Attendence", attendenceSchema);
export default Attendence;
