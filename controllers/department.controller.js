import Department from "../models/department.js";
import Employee from "../models/employee.js";

//create department
export const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ message: "Department created", department });
  } catch (err) {
    // fixed .json call
    res.status(400).json({ message: err.message });
  }
};

//get all department
export const getDepartment = async (req, res) => {
  try {
    const departments = await Department.find().populate("head", "name email");

    const result = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({
          department: dept._id,
        });

        return {
          _id: dept._id,
          name: dept.name,
          description: dept.description,
          createdAt: dept.createdAt,
          employeeCount,
          head: dept.head ? { _id: dept.head._id, name: dept.head.name } : null,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//get department by id
export const getDepartmentById = async (req, res) => {
  try {
    const id = req.params.id;
    const department = await Department.findById(id).populate(
      "head",
      "name email"
    );
    if (!department)
      return res.status(404).json({ message: "department not found" });
    const employeeCount = await Employee.countDocuments({ department: id });

    res.json({
      ...department.toObject(),
      employeeCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//update department
export const updateDepartment = async (req, res) => {
  try {
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: "department updated", updatedDepartment });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//delete department
export const deletedDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "department deleted" });
  } catch (err) {
    // fixed .json call
    res.status(400).json({ message: err.message });
  }
};

//asign department to employee

export const assignDepartment = async (req, res) => {
  try {
    const { employeeId, departmentId } = req.body;
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ message: "Department not found" });
    }
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { department: departmentId },
      { new: true }
    ).populate("department");
    return res
      .status(200)
      .json({ message: "Department assaigned successfull", employee });
  } catch (err) {
    // use res instead of req
    res.status(500).json({ message: err.message });
  }
};

//get employee BY department

export const getEmployeeByDepartment = async (req, res) => {
  try {
    const { id: departmentId } = req.params;
    const department = await Department.findById(departmentId).populate(
      "head",
      "name position email"
    );
    if (!department)
      return res.status(400).json({ message: "Department not found" });

    const employees = await Employee.find({ department: departmentId }).select(
      "-password"
    );
    return res.status(200).json({
      message: `Employees in Department ${department.name}`,
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//asign head of a department
export const assignDepartmentHead = async (req, res) => {
  try {
    const { departmentId, employeeId } = req.body;

    const department = await Department.findByIdAndUpdate(
      departmentId,
      { head: employeeId },
      { new: true }
    ).populate("head", "name position email");

    res.status(200).json({
      message: "Department head assigned successfully",
      department,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDepartmentEmployeeStats = async (req, res) => {
  try {
    const fromCollection = Department.collection.name; // use actual collection name
    const data = await Employee.aggregate([
      {
        $lookup: {
          from: fromCollection,
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$department.name",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      },
    ]);

    res.status(200).json(data);
  } catch (error) {
    console.error("Department stats error:", error);
    res.status(500).json({ message: error.message });
  }
};
