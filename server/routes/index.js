const express = require("express");
const userRoutes = require("./userRoute.js");
const taskRoutes = require("./taskRoute.js");
const { protectRoute } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Add a simple test endpoint that doesn't require authentication
router.get("/", (req, res) => {
  res.json({ message: "API is working!" });
});

// Add a debug endpoint to check authorization
router.get("/check-auth", (req, res) => {
  // Log all headers for debugging
  console.log("Request Headers:", req.headers);

  // Check for token in various places
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;

  return res.json({
    message: "Auth check endpoint",
    hasAuthHeader: !!authHeader,
    hasCookieToken: !!cookieToken,
    authHeaderValue: authHeader ? `${authHeader.slice(0, 10)}...` : null,
    cookieTokenValue: cookieToken ? `${cookieToken.slice(0, 10)}...` : null,
  });
});

// Add a protected endpoint for testing auth
router.get("/protected", protectRoute, (req, res) => {
  res.json({
    message: "You accessed a protected endpoint!",
    user: req.user,
  });
});

router.use("/user", userRoutes);
router.use("/task", taskRoutes);

module.exports = router;
