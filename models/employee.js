import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: false },
    position: { type: String, required: true },
    salary: { type: Number, required: true },
    phone: { type: Number, required: false },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    profileImage: { type: String },
  },
  { timestamps: true },
);
const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
