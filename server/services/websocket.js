const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Connected users' socket mapping
const connectedUsers = new Map();

const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["*"],
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

  return {
    io,
    // Helper method to send notifications to specific users
    sendNotification: (userId, event, data) => {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    },
    // Broadcast to all connected users
    broadcast: (event, data) => {
      io.emit(event, data);
    },
  };
};

module.exports = initializeWebSocket;
