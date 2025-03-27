import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database.js";
import User from "../models/postgres/User.js";

const protectRoute = asyncHandler(async (req, res, next) => {
  // Get token from cookie or authorization header
  let token = req.cookies?.token;

  // If no token in cookie, check authorization header
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Using token from Authorization header:", token);
  }

  if (token) {
    try {
      console.log("Verifying token:", token);
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified, decoded:", decodedToken);

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decodedToken.userId },
        select: ["id", "email", "role"],
      });

      if (!user) {
        console.log("User not found for token");
        return res.status(401).json({
          status: false,
          message: "User not found. Try login again.",
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
      };

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res
        .status(401)
        .json({ status: false, message: "Not authorized. Token invalid." });
    }
  } else {
    console.log("No token found in request");
    return res
      .status(401)
      .json({ status: false, message: "Not authorized. No token provided." });
  }
});

const isAdminRoute = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin)) {
    next();
  } else {
    return res.status(401).json({
      status: false,
      message: "Not authorized as admin. Access denied.",
    });
  }
};

export { isAdminRoute, protectRoute };
