import Attendence from "../models/attendence.js";
import Employee from "../models/employee.js";
import getTodayRange from "../utils/get-today.js";
import calculateStatus from "../utils/calculate-status.js";
import getLastNDates from "../utils/get-last-n-days.js";

//punch-in
export const createPunchIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const { start, end } = getTodayRange();

    const punchInTime = new Date();
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    const alreadyPunched = await Attendence.findOne({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });
    if (alreadyPunched)
      return res.status(400).json({ message: "Already punched today" });

    const attendence = await Attendence.create({
      employee: employeeId,
      date: start,
      punchIn: punchInTime,
      status: calculateStatus(punchInTime),
    });
    return res
      .status(200)
      .json({ message: "Punch-In Successfull", attendence });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//punch-out
export const createPunchOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { start, end } = getTodayRange();
    const records = await Attendence.findOne({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });

    if (!records) {
      return res
        .status(400)
        .json({ message: "You have not punched in today." });
    }

    if (records.punchOut) {
      return res
        .status(400)
        .json({ message: "You have already punch-out today." });
    }

    records.punchOut = new Date();

    const diffrence = records.punchOut - records.punchIn;
    records.workHours = Number(diffrence / (1000 * 60 * 60)).toFixed(2);
    await records.save();
    return res.status(200).json({
      message: "Punch-out successfull",
      records,
      "Work Hours": records.workHours,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//employee today-attendence
export const getTodayAttendence = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const { start, end } = getTodayRange();
    const attendence = await Attendence.findOne({
      employee: employeeId,
      date: { $gte: start, $lte: end },
    });
    if (!attendence) {
      return res.status(200).json({
        message: "No attendance today",
        attendence: null,
      });
    }
    

    res.status(200).json({ message: "Today attendence:", attendence });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//employee attendence history

export const getAttendenceHistory = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const last7Dates = getLastNDates(7); // last 7 days

    const records = await Attendence.find({ employee: employeeId });

    // Map through last 7 dates and find corresponding records, fill in absent if not found
    const history = last7Dates.map((date) => {
      const record = records.find(
        (r) => r.date.toDateString() === date.toDateString(),
      );
      if (record) return record;
      return {
        date,
        punchIn: null,
        punchOut: null,
        workHours: null,
        status: "Absent",
        _id: `absent-${date.getTime()}`,
      };
    });

    res.status(200).json({
      message: "Attendance history fetched successfully",
      attendence: history,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
