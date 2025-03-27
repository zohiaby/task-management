import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "TASK_CREATED",
        "TASK_UPDATED",
        "TASK_DELETED",
        "SUBTASK_CREATED",
        "SUBTASK_UPDATED",
        "SUBTASK_COMPLETED",
        "COMMENT_ADDED",
        "USER_REGISTERED",
        "USER_STATUS_CHANGED",
        "SYSTEM_EVENT",
      ],
    },
    userId: {
      type: String, // PostgreSQL User UUID
      required: false,
    },
    targetId: {
      type: String, // Target entity UUID (task, user, etc)
      required: false,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["TASK", "SUBTASK", "USER", "COMMENT", "SYSTEM"],
    },
    metadata: {
      type: Object, // Additional data related to the event
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries on common lookup patterns
eventSchema.index({ eventType: 1, createdAt: -1 });
eventSchema.index({ userId: 1, createdAt: -1 });
eventSchema.index({ targetId: 1, targetType: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
