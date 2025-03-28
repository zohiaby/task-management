const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const path = require("path");
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

// Initialize databases and start server
const start = async () => {
  try {
    console.log("MongoDB URL:", process.env.MONGODB_URL); // Debug log

    // Initialize both databases before setting up routes
    await connectMongoDB();
    await initializePostgresDB();

    // Confirm AppDataSource is ready
    if (!AppDataSource.isInitialized) {
      throw new Error("PostgreSQL Data Source failed to initialize properly");
    }

    // API routes - only set up after database initialization
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
