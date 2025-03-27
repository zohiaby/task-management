const Notification = require("../models/mongo/notificationModel");
const Event = require("../models/mongo/eventModel");
const SocketService = require("./socketService");
const emailService = require("./emailService");
const { AppDataSource } = require("../config/database");
const User = require("../models/postgres/User");

class NotificationService {
  // Create notification and send through appropriate channels
  async createNotification({
    userId,
    type,
    title,
    message,
    entityId,
    entityType,
    sendEmail = false,
  }) {
    try {
      // Create MongoDB notification document
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        entityId,
        entityType,
      });

      // Send real-time notification via WebSocket if user is online
      if (SocketService.isUserOnline(userId)) {
        SocketService.sendNotification(userId, "notification", {
          id: notification._id,
          type,
          title,
          message,
        });
      }

      // Send email notification if requested
      if (sendEmail) {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });

        if (user && user.email) {
          const emailData = {
            userEmail: user.email,
            userName: user.name,
            title,
            message,
          };

          switch (type) {
            case "TASK_ASSIGNED":
              await emailService.sendTaskAssignmentEmail(
                emailData.userEmail,
                emailData.userName,
                title,
                message
              );
              break;
            case "TASK_UPDATED":
              await emailService.sendTaskUpdateEmail(
                emailData.userEmail,
                emailData.userName,
                title,
                "Updated"
              );
              break;
            default:
              break;
          }
        }
      }

      return notification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  // Log an event in the system
  async logEvent({
    eventType,
    userId,
    targetId,
    targetType,
    metadata,
    ipAddress,
  }) {
    try {
      return await Event.create({
        eventType,
        userId,
        targetId,
        targetType,
        metadata,
        ipAddress,
      });
    } catch (error) {
      console.error("Failed to log event:", error);
      // Non-critical error, just log it
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification || notification.userId !== userId) {
        throw new Error("Notification not found or unauthorized");
      }

      notification.isRead = true;
      await notification.save();
      return notification;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );

      return result;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  }

  // Get all notifications for a user
  async getUserNotifications(userId, filters = {}) {
    const { isRead, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const query = { userId };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }

    try {
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
