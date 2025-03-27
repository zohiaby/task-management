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

// API routes
app.use("/api", routes);

// Error handling
app.use(routeNotFound);
app.use(errorHandler);

// Initialize databases
const start = async () => {
  try {
    console.log("MongoDB URL:", process.env.MONGODB_URL); // Debug log
    await connectMongoDB();
    await initializePostgresDB();

    const port = process.env.PORT || 4000;
    const wsPort = process.env.WS_PORT || 3001;

    server.listen(wsPort, () =>
      console.log(`WebSocket server running on port ${wsPort}`)
    );

    app.listen(port, () =>
      console.log(
        `API server running in ${process.env.NODE_ENV} mode on port ${port}`
      )
    );
  } catch (error) {
    console.error("Server initialization failed:", error);
    process.exit(1);
  }
};

start();
