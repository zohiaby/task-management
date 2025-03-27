import asyncHandler from "express-async-handler";
import userService from "../services/userService.js";
import notificationService from "../services/notificationService.js";
import { AppDataSource } from "../config/database.js";
import User from "../models/postgres/User.js";
import { hashPassword } from "../models/postgres/User.js";

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  try {
    const userData = req.body;
    // When user signs up directly, they become admin
    const newUser = await userService.registerUser(userData, true);

    // Generate JWT token
    const token = userService.createToken(newUser.id);

    // Set token as cookie
    userService.setTokenCookie(res, token);

    // Filter out password
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userService.loginUser(email, password);

    // Generate JWT token
    const token = userService.createToken(user.id);

    // Set token as cookie
    userService.setTokenCookie(res, token);

    // Include token in response
    res.status(200).json({
      ...user,
      token, // Include token in response body
    });
  } catch (error) {
    res.status(401).json({ status: false, message: error.message });
  }
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ status: true, message: "Logged out successfully" });
});

// Get team list (admin only)
const getTeamList = asyncHandler(async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find({
      select: ["id", "name", "email", "role", "isActive", "avatar"],
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Get user task status - for admin dashboard
const getUserTaskStatus = asyncHandler(async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    // First, get all active users
    const users = await userRepository.find({
      where: { isActive: true },
      select: ["id", "name"],
    });

    // Create a default result structure with zero counts for all users
    const userStats = users.map((user) => ({
      id: user.id,
      name: user.name,
      pending_tasks: 0,
      in_progress_tasks: 0,
      completed_tasks: 0,
      total_tasks: 0,
    }));

    // Log success even if we can't connect to task tables
    res.status(200).json({
      success: true,
      data: userStats,
      note: "Basic user data returned. Task counts not available.",
    });
  } catch (error) {
    console.error("Error in getUserTaskStatus:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add a team member (admin only)
const addTeamMember = asyncHandler(async (req, res) => {
  try {
    const userData = req.body;

    // When admin adds a user, they become a regular user
    const newUser = await userService.registerUser(userData, false);

    // Filter out password
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json({
      status: true,
      message: "User added successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.user;
    const userData = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // If admin is updating another user
    const targetId =
      userData._id && req.user.role === "admin" ? userData._id : id;

    const user = await userRepository.findOne({
      where: { id: targetId },
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Update user properties
    if (userData.name) user.name = userData.name;
    if (userData.title) user.title = userData.title;
    if (userData.role && req.user.role === "admin") user.role = userData.role;

    const updatedUser = await userRepository.save(user);

    // Log event
    await notificationService.logEvent({
      eventType: "USER_STATUS_CHANGED",
      userId: req.user.id,
      targetId: user.id,
      targetType: "USER",
      metadata: { updated: true },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    res.status(201).json({
      status: true,
      message: "Profile Updated Successfully.",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Change user password
const changeUserPassword = asyncHandler(async (req, res) => {
  try {
    const { id } = req.user;
    const { password } = req.body;

    // Special case for demo account - keep this behavior
    if (id === "65ff94c7bb2de638d0c73f63") {
      return res.status(404).json({
        status: false,
        message:
          "This is a test user. You can not change password. Thank you!!!",
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;

    await userRepository.save(user);

    res.status(201).json({
      status: true,
      message: `Password changed successfully.`,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Activate/deactivate user (admin only)
const activateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    user.isActive = isActive;
    await userRepository.save(user);

    // Log event
    await notificationService.logEvent({
      eventType: "USER_STATUS_CHANGED",
      userId: req.user.id,
      targetId: id,
      targetType: "USER",
      metadata: { isActive },
    });

    res.status(201).json({
      status: true,
      message: `User account has been ${isActive ? "activated" : "disabled"}`,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Delete user (admin only)
const deleteUserProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    await userRepository.remove(user);

    // Log event
    await notificationService.logEvent({
      eventType: "USER_STATUS_CHANGED",
      userId: req.user.id,
      targetId: id,
      targetType: "USER",
      metadata: { deleted: true },
    });

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Get notifications
const getNotificationsList = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, isRead } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      isRead: isRead === "true",
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      status: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Mark notification as read
const markNotificationRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, all } = req.body;

    if (all) {
      // Mark all notifications as read
      const notifications = await notificationService.markAllRead(userId);
      res
        .status(201)
        .json({ status: true, message: "All notifications marked as read" });
    } else if (id) {
      // Mark specific notification as read
      await notificationService.markAsRead(id, userId);
      res
        .status(201)
        .json({ status: true, message: "Notification marked as read" });
    } else {
      res
        .status(400)
        .json({ status: false, message: "Missing notification ID" });
    }
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

export {
  activateUserProfile,
  changeUserPassword,
  deleteUserProfile,
  getNotificationsList,
  getTeamList,
  getUserTaskStatus,
  loginUser,
  logoutUser,
  markNotificationRead,
  registerUser,
  updateUserProfile,
  addTeamMember,
};
