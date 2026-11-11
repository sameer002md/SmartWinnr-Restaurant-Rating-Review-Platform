
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// GET ALL USERS + SEARCH + ROLE FILTER
export const getAllUsers = async (req, res) => {
  try {
    const { search, role } = req.query;

    const filter = {};

    if (role && ["admin", "customer", "owner"].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error("Get Users Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve users"
    });
  }
};

// CREATE RESTAURANT OWNER ACCOUNT
export const createOwnerAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,16}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8-16 characters with uppercase, lowercase, number and special character"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const owner = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "owner"
    });

    res.status(201).json({
      success: true,
      message: "Restaurant owner account created successfully",
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        isActive: owner.isActive
      }
    });

  } catch (error) {
    console.error("Create Owner Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create owner account"
    });
  }
};

// ACTIVATE / DEACTIVATE USER
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false"
      });
    }

    if (req.params.id === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user
    });

  } catch (error) {
    console.error("Update User Status Error:", error);

    res.status(400).json({
      success: false,
      message: "Unable to update user status"
    });
  }
};
