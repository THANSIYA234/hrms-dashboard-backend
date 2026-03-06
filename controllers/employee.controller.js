import Employee from "../models/employee.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";

//create employee
export const createEmployee = async (req, res) => {
  try {
    const employeeData = {
      user: req.body.userId,
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      position: req.body.position,
      salary: req.body.salary,
      phone: req.body.phone,
      department: req.body.department,
    };

    if (req.file) {
      employeeData.profileImage = req.file.path;
    }

    const employee = await Employee.create(employeeData);

    await User.findOneAndUpdate(
      { email: req.body.email },
      { employeeId: employee._id },
    );

    res.status(201).json({
      message: "Employee created",
      employee,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//get all employees
export const getEmployees = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const department = req.query.department || "";

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (department) {
      query.department = department;
    }

    // Get total count
    const total = await Employee.countDocuments(query);

    // Get paginated data
    const employees = await Employee.find(query)
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: employees,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//get employee by id
export const getEmployeeById = async (req, res) => {
  try {
    const employeeById = await Employee.findById(req.params.id).populate(
      "department",
      "name",
    );

    if (!employeeById)
      return res.status(404).json({ message: "Employee not found" });

    res.json(employeeById);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//update employee
export const updateEmployeeById = async (req, res) => {
  try {
    if (req.file) {
      req.body.profileImage = req.file.path; // save path to MongoDB
    }
    const updateEmployeeById = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updateEmployeeById)
      return res.status(404).json({ message: "Employee not found" });
    res.json(updateEmployeeById);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//delete employee
export const deleteEmployeeById = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//fetch employee
export const ProfileView = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const employee = await Employee.findById(employeeId)
      .populate("department", "name")
      .select("-password");
    if (!employee) {
      return res.status(401).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "fetched successfully", employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update profile

export const updateProfile = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    let updates = req.body;
    if (req.file) {
      updates.profileImage = `uploads/profilePics/${req.file.filename}`; // save path to MongoDB
    }
    const employee = await Employee.findByIdAndUpdate(employeeId, updates, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    const matched = await bcrypt.compare(oldPassword, user.password);
    if (!matched)
      return res.status(400).json({ message: "old password is  incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    res.status(200).json({ message: "Password changed successfully" });

    await user.save();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
