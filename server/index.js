import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";
import { connectMongoDB, initializePostgresDB } from "./config/database.js";
import { createSocketServer } from "./services/socketService.js";
import SocketService from "./services/socketService.js";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
