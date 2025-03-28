const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const {
  errorHandler,
  routeNotFound,
} = require("./middleware/errorMiddleware.js");
const routes = require("./routes/index.js");
const {
  connectMongoDB,
  initializePostgresDB,
  AppDataSource,
} = require("./config/database.js");
const { createSocketServer } = require("./services/socketService.js");
const SocketService = require("./services/socketService.js");

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// CORS configuration - simplify to allow all origins
app.use(
  cors({
    origin: true, // This allows all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true, // Needed to receive cookies
  })
);

// Pre-flight OPTIONS requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Create HTTP and Socket.IO server
const { server, io } = createSocketServer(app);
SocketService.initialize(io);

// Test route
app.get("/test", (req, res) => {
  res.send("Server is working! 🎉");
});

// Define database error handler route
app.get("/api/server-status", (req, res) => {
  const dbStatus = {
    mongodb:
      mongoose.connection?.readyState === 1 ? "connected" : "disconnected",
    postgres: AppDataSource.isInitialized ? "connected" : "disconnected",
  };

  res.json({
    server: "online",
    databases: dbStatus,
    environment: process.env.NODE_ENV || "development",
  });
});

// Initialize databases and start server
const start = async () => {
  try {
    console.log("MongoDB URL:", process.env.MONGODB_URL); // Debug log

    // Initialize MongoDB first
    await connectMongoDB();

    // Try to initialize PostgreSQL, but don't fail the server if it's not available
    try {
      await initializePostgresDB();

      // Confirm AppDataSource is ready
      if (!AppDataSource.isInitialized) {
        console.warn(
          "Warning: PostgreSQL Data Source failed to initialize properly"
        );
      }
    } catch (dbError) {
      console.error("PostgreSQL connection error:", dbError.message);
      console.log("\n===========================================");
      console.log("⚠️  PostgreSQL connection failed!");
      console.log("The server will start with limited functionality.");
      console.log(
        "Make sure PostgreSQL is running and check your connection settings."
      );
      console.log("===========================================\n");
    }

    // API routes - set up regardless of database status
    app.use("/api", routes);

    // Error handling
    app.use(routeNotFound);
    app.use(errorHandler);

    const port = process.env.PORT || 4000; // Use one port for both HTTP and WebSocket

    server.listen(port, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${port} (HTTP and WebSocket)`
      );
    });
  } catch (error) {
    console.error("Server initialization failed:", error);
    process.exit(1);
  }
};

start();
