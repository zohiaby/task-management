const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: String, // Using string to store UUID from PostgreSQL
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["TASK_ASSIGNED", "TASK_UPDATED", "COMMENT_ADDED", "SYSTEM"],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    entityId: {
      type: String, // UUID of related entity (task, comment, etc.)
      required: false,
    },
    entityType: {
      type: String,
      required: false,
      enum: ["TASK", "COMMENT", "SUBTASK", "USER", null],
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
