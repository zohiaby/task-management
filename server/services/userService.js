import { AppDataSource } from "../config/database.js";
import User, {
  hashPassword,
  comparePassword,
} from "../models/postgres/User.js";
import jwt from "jsonwebtoken";
import notificationService from "./notificationService.js";

class UserService {
  async registerUser(userData, isSignup = true) {
    const userRepository = AppDataSource.getRepository(User);

    // Check if user exists
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Set role based on registration source
    // If coming from signup, make admin. If added by admin, make user
    const role = isSignup ? "admin" : "user";

    // Create new user
    const newUser = userRepository.create({
      ...userData,
      password: hashedPassword,
      role,
      isAdmin: role === "admin",
    });

    const savedUser = await userRepository.save(newUser);

    // Log event
    await notificationService.logEvent({
      eventType: "USER_REGISTERED",
      userId: savedUser.id,
      targetId: savedUser.id,
      targetType: "USER",
      metadata: {
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });

    return savedUser;
  }

  async loginUser(email, password) {
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Contact administrator");
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  createToken(userId) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });

    return token;
  }

  setTokenCookie(res, token) {
    // Set JWT as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
}

export default new UserService();
