import mongoose from "mongoose";
import Attendence from "../models/attendence.js";
import Leave from "../models/leave.js";
import Employee from "../models/employee.js";
import calculateStatus from "../utils/calculate-status.js";

//get all attendence
export const getAllAttendance = async (req, res) => {
  try {
    const { search, department, date } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const selectedDate = date ? new Date(date) : new Date();
    const start = new Date(selectedDate.setHours(0, 0, 0, 0));
    const end = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Step 1: get all employees (apply department / search filters)
    const empFilter = {};
    if (department) empFilter.department = department;
    if (search) {
      empFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const allEmployees = await Employee.find(empFilter);

    // Step 2: get attendance for selected date
    const attendances = await Attendence.find({
      date: { $gte: start, $lte: end },
    });

    // Step 3: get approved leaves
    const leaves = await Leave.find({
      status: "Approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    // Step 4: merge into unified list
    const attendanceList = allEmployees.map((emp) => {
      const attendance = attendances.find(
        (a) => a.employee.toString() === emp._id.toString(),
      );
      const leave = leaves.find(
        (l) => l.employee.toString() === emp._id.toString(),
      );

      return {
        _id: attendance?._id || emp._id,
        employee: emp,
        date: selectedDate,
        punchIn: attendance?.punchIn || null,
        punchOut: attendance?.punchOut || null,
        status: attendance ? "Present" : leave ? "Leave" : "Absent",
      };
    });

    // Step 5: pagination
    const paginated = attendanceList.slice(skip, skip + limit);

    res.status(200).json({
      records: paginated,
      total: attendanceList.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//get employee by id

export const getAttendendenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await Attendence.find({ employee: id });
    populate({
      path: "employee",
      select: "name email department",
      populate: {
        path: "department",
        select: "name",
      },
    }).sort({ date: -1 });

    res.status(200).json({
      message: "Attendence fetched successfully",
      records: records,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// filter attendence by date-range

export const filterAttendenceByDate = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start && !end) {
      return res
        .status(400)
        .json({ message: "Start and end dates are required" });
    }
    const records = await Attendence.find({ date: { $gte: start, $lte: end } });

    populate({
      path: "employee",
      select: "name email department",
      populate: {
        path: "department",
        select: "name",
      },
    }).sort({ date: -1 });

    res.status(200).json({
      message: `Attendence from ${start} to ${end}`,
      count: records.length,
      records: records,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update attendence

export const updateAttendence = async (req, res) => {
  try {
    const { id } = req.params;
    const { punchIn, punchOut } = req.body;

    const record = await Attendence.findById(id);
    if (!record) {
      return res.status(404).json({ message: "No records found" });
    }

    const newPunchIn = punchIn ? new Date(punchIn) : record.punchIn;
    const newPunchOut = punchOut ? new Date(punchOut) : record.punchOut;

    if (newPunchIn && newPunchOut && newPunchOut < newPunchIn) {
      return res
        .status(400)
        .json({ message: "Punch-out cannot be before punch-in" });
    }

    record.punchIn = newPunchIn;
    record.punchOut = newPunchOut;

    if (record.punchIn) {
      record.status = calculateStatus(record.punchIn);
    }

    if (record.punchIn && record.punchOut) {
      const diff = record.punchOut - record.punchIn;
      record.workHours = diff / (1000 * 60 * 60);
    }

    await record.save();

    res.status(200).json({
      message: "Attendance record updated successfully",
      record,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete attendence

export const deleteAttendenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await Attendence.findById(id);

    if (!records) {
      return res.status(400).json({ message: "No attendence record found" });
    }

    await Attendence.findByIdAndDelete(id);
    res.status(200).json({
      message: "Attendence Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get attendence by filters

export const getAttendanceByFilters = async (req, res) => {
  try {
    const { department, search, date } = req.query;

    const attendanceFilter = {};
    const employeeFilter = {};

    // ✅ SINGLE DATE FILTER (UAE example +04:00)
    if (date) {
      // Make sure it's a valid date string
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate)) {
        // Start of the day
        const start = new Date(parsedDate);
        start.setHours(0, 0, 0, 0);

        // End of the day
        const end = new Date(parsedDate);
        end.setHours(23, 59, 59, 999);

        attendanceFilter.date = {
          $gte: start,
          $lte: end,
        };
      } else {
        console.warn("Invalid date passed to filter:", date);
      }
    }

    // ✅ Department filter
    if (department) {
      employeeFilter.department = department;
    }

    // ✅ Search filter
    if (search) {
      employeeFilter.name = { $regex: search, $options: "i" };
    }

    // 🔥 Get matching employees
    const employees = await Employee.find(employeeFilter).select("_id");
    const employeeIds = employees.map((emp) => emp._id);

    if ((department || search) && employeeIds.length === 0) {
      return res.status(200).json({ records: [] });
    }

    if (department || search) {
      attendanceFilter.employee = { $in: employeeIds };
    }

    const records = await Attendence.find(attendanceFilter)
      .populate({
        path: "employee",
        select: "name department",
        populate: { path: "department", select: "name" },
      })
      .sort({ date: -1 });

    res.status(200).json({ records });
  } catch (error) {
    console.error("FILTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
//total work hours of employees

export const getTotalWorkHours = async (req, res) => {
  try {
    const records = await Attendence.find();
    const totalHours = records.reduce(
      (acc, rec) => acc + (rec.workHours || 0),
      0,
    );
    res
      .status(200)
      .json({ message: "total work hours for all employees:", totalHours });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//total work hours of an employee

export const getTotalWorkHoursByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const records = await Attendence.find({ employee: employeeId });
    const totalHours = records.reduce(
      (acc, rec) => acc + (rec.workHours || 0),
      0,
    );
    res.status(200).json({
      message: `total work hours of employee:${employeeId}`,
      totalHours,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get work hours of department
export const getTotalWorkHoursByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const employees = await Employee.find({ department: departmentId }).select(
      "_id",
    );
    const employeeIds = employees.map((emp) => emp._id);

    const records = await Attendence.find({ employee: { $in: employeeIds } });
    const totalHours = records.reduce(
      (acc, rec) => acc + (rec.workHours || 0),
      0,
    );

    res.status(200).json({
      message: `Total work hours for department ${departmentId}`,
      totalHours,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//getworkhours by date
export const getTotalWorkHoursByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const records = await Attendence.find({ date });
    const totalHours = records.reduce(
      (acc, rec) => acc + (rec.workHours || 0),
      0,
    );

    res
      .status(200)
      .json({ message: `Total work hours for date ${date}`, totalHours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//get attendance stats for dashboard
export const getAttendanceStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Fetch today's attendance
    const todaysAttendance = await Attendence.find({
      date: { $gte: today, $lt: tomorrow },
    });

    const allEmployees = await Employee.find();

    // Map attendance by employeeId
    const attendanceMap = new Map();
    todaysAttendance.forEach((a) => {
      attendanceMap.set(a.employeeId.toString(), a.status);
    });

    let presentToday = 0;
    let leaveToday = 0;
    let absentToday = 0;

    allEmployees.forEach((emp) => {
      const status = attendanceMap.get(emp._id.toString());
      if (status === "present") presentToday++;
      else if (status === "leave") leaveToday++;
      else absentToday++; // either absent or not marked
    });

    res.status(200).json({
      present: presentToday,
      leave: leaveToday,
      absent: absentToday,
      totalEmployees: allEmployees.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
//get attendance trend

export const getAttendanceTrend = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Fetch attendance in last 30 days
    const records = await Attendence.find({
      date: { $gte: thirtyDaysAgo, $lte: today },
    });

    // Group into 5-day intervals
    const intervals = [];
    for (let i = 0; i < 30; i += 5) {
      const start = new Date(thirtyDaysAgo);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 4); // 5-day interval

      const count = records.filter(
        (r) => r.date >= start && r.date <= end,
      ).length;

      intervals.push({
        day: `${start.getDate()}-${end.getDate()} ${start.toLocaleString(
          "default",
          { month: "short" },
        )}`,
        value: count,
      });
    }

    res.status(200).json(intervals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get attendence of today

export const getTodayAttendanceSnapshot = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Step 1: get all employees
  const allEmployees = await Employee.find();

  // Step 2: get today's attendance
  const todaysAttendance = await Attendence.find({
    date: { $gte: today, $lt: tomorrow },
  });

  // Step 3: get approved leaves for today
  const todaysLeaves = await Leave.find({
    status: "Approved",
    fromDate: { $lte: today },
    toDate: { $gte: today },
  });

  // Step 4: merge to generate full attendance list
  const attendanceList = allEmployees.map((emp) => {
    const attendance = todaysAttendance.find(
      (a) => a.employee.toString() === emp._id.toString(),
    );
    const leave = todaysLeaves.find(
      (l) => l.employee.toString() === emp._id.toString(),
    );

    return {
      _id: attendance?._id || emp._id,
      employee: emp,
      date: today,
      punchIn: attendance?.punchIn || null,
      punchOut: attendance?.punchOut || null,
      status: attendance ? "Present" : leave ? "Leave" : "Absent",
    };
  });

  res.status(200).json({ records: attendanceList });
};
