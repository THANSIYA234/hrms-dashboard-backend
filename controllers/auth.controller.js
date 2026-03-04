import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userRole = role || "employee";
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exist" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: userRole,
    });

    const userWithoutPassword = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return res.json({ message: "user created", userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//refresh token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token" });

    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(401).json({ message: "Invalid refresh token" });

    try {
      jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//logout
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(400).json({ message: "Invalid refresh token" });
    }
    user.refreshToken = "";
    await user.save();

    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logout successfull" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select(
      "-password -refreshToken",
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
