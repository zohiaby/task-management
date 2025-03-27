import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import http from "http";

// Connected users' socket mapping
const connectedUsers = new Map();

// Create socket.io server
export const createSocketServer = (expressApp) => {
  const server = http.createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: [
        "https://mern-task-manager-app.netlify.app",
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Auth middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    // Store user's socket connection
    connectedUsers.set(userId, socket.id);

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      connectedUsers.delete(userId);
    });

    // Testing event
    socket.emit("welcome", { message: "Connected to WebSocket server" });
  });

  return { server, io };
};

// Socket service singleton
class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    if (this.io) return;
    this.io = io;
  }

  // Send notification to specific user
  sendNotification(userId, event, data) {
    if (!this.io) return;
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // Check if a user is online
  isUserOnline(userId) {
    return connectedUsers.has(userId);
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(connectedUsers.keys());
  }
}

export default new SocketService();
