import Leave from "../models/leave.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// APPLY LEAVE — EMPLOYEE
export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { startDate, endDate, type, reason } = req.body;

    if (!startDate || !endDate || !type || !reason)
      return res.status(400).json({ message: "All fields required" });

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return res.status(400).json({ message: "Invalid date format" });

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end)
      return res.status(400).json({ message: "Invalid date range" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today)
      return res.status(400).json({ message: "Past leave not allowed" });

    const overlap = await Leave.findOne({
      employee: employeeId,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlap)
      return res.status(400).json({ message: "Leave overlap exists" });

    const leave = await Leave.create({
      employee: employeeId,
      startDate: start,
      endDate: end,
      type,
      reason,
      status: "Pending",
    });

    const admins = await User.find({ role: "admin" });
    const user = req.user; // already the logged-in user
    // ...

    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          user: admin._id,
          role: "admin",
          title: "New Leave Request",
          link: `/admin/leave`,
          message: `${user.name} applied for ${type} leave from ${startDate} to ${endDate}`,
        }),
      ),
    );

    return res.status(201).json({ message: "Leave applied", leave });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// GET ALL LEAVES — ADMIN
export const getAllLeaves = async (req, res) => {
  const limits = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * limits;

  const { status, search } = req.query;

  let filter = {};
  if (status && status !== "") {
    filter.status = status;
  }

  const total = await Leave.countDocuments(filter);

  const leaves = await Leave.find(filter)
    .populate({
      path: "employee",
      select: "name email profileImage",
      match: search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {},
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limits);

  const filteredLeaves = search
    ? leaves.filter((leave) => leave.employee)
    : leaves;

  res.json({
    leaves: filteredLeaves,
    total,
  });
};

// GET LEAVES — EMPLOYEE
export const getLeavesHistory = async (req, res) => {
  const limits = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * limits;
  const leaves = await Leave.find({ employee: req.user.employeeId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limits);
  res.json({ leaves });
};

// GET LEAVE BY ID — EMPLOYEE
export const getLeaveById = async (req, res) => {
  const leave = await Leave.findOne({
    _id: req.params.id,
    employee: req.user.employeeId,
  });
  if (!leave) return res.status(404).json({ message: "Not found" });
  res.json({ leave });
};

// UPDATE LEAVE — EMPLOYEE (only Pending)
export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, type, reason } = req.body;

    const leave = await Leave.findOne({
      _id: id,
      employee: req.user.employeeId,
      status: "Pending",
    });
    if (!leave) return res.status(400).json({ message: "Cannot update" });

    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) throw new Error("Invalid startDate");
      leave.startDate = normalizeDate(start);
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) throw new Error("Invalid endDate");
      leave.endDate = normalizeDate(end);
    }
    if (type) leave.type = type;
    if (reason) leave.reason = reason;

    await leave.save();

    await Notification.create({
      user: leave.employee,
      title: `Leave ${status}`,
      message: `Your leave request has been ${status.toLowerCase()}`,
    });
    res.json({ message: "Leave updated", leave });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE LEAVE — EMPLOYEE (only Pending)
export const deleteLeave = async (req, res) => {
  const leave = await Leave.findOneAndDelete({
    _id: req.params.id,
    employee: req.user.employeeId,
    status: "Pending",
  });
  if (!leave) return res.status(400).json({ message: "Cannot delete" });
  res.json({ message: "Leave deleted" });
};

// UPDATE LEAVE STATUS — ADMIN
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Approved", "Rejected"].includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const leave = await Leave.findById(id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  leave.status = status;
  await leave.save();

  await Notification.create({
    user: leave.employee,
    role: "employee",
    title: `Leave ${status}`,
    link: `/employee/leave`,
    message: `Your leave request has been ${status.toLowerCase()}`,
  });

  res.json({ message: "Status updated", leave });
};

//balance leave calculation

export const getBalanceLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const approvedLeaves = await Leave.find({
      employee: employeeId,
      status: "approved",
    });

    let usedDays = 0;

    approvedLeaves.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      usedDays += diff;
    });

    const TOTAL_LEAVES = 20;

    const remaining = TOTAL_LEAVES - usedDays;

    res.json({
      total: TOTAL_LEAVES,
      used: usedDays,
      remaining,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
