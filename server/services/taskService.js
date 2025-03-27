const { AppDataSource } = require("../config/database.js");
const { isValidUUID, filterValidUUIDs } = require("../utils/validators.js");
const Task = require("../models/postgres/Task.js");
const SubTask = require("../models/postgres/SubTask.js");
const User = require("../models/postgres/User.js");
const notificationService = require("./notificationService.js");
const socketService = require("./socketService.js");
const { In } = require("typeorm");

class TaskService {
  async createTask(taskData, creatorId) {
    const taskRepository = AppDataSource.getRepository(Task);
    const userRepository = AppDataSource.getRepository(User);

    // Get creator
    const creator = await userRepository.findOne({
      where: { id: creatorId },
    });

    if (!creator) {
      throw new Error("Creator not found");
    }

    // Create task
    const newTask = taskRepository.create({
      ...taskData,
      creator,
    });

    const savedTask = await taskRepository.save(newTask);

    // If task has assignees, process them
    if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
      const assignees = await userRepository.findBy({
        id: taskData.assigneeIds,
      });

      if (assignees.length > 0) {
        savedTask.assignees = assignees;
        await taskRepository.save(savedTask);

        // Notify assignees
        await this.notifyAssignees(savedTask, assignees);
      }
    }

    // Log event
    await notificationService.logEvent({
      eventType: "TASK_CREATED",
      userId: creatorId,
      targetId: savedTask.id,
      targetType: "TASK",
      metadata: {
        title: savedTask.title,
        priority: savedTask.priority,
      },
    });

    return savedTask;
  }

  async updateTask(taskId, taskData, updaterId) {
    const taskRepository = AppDataSource.getRepository(Task);
    const userRepository = AppDataSource.getRepository(User);

    // Find task
    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ["assignees", "creator"],
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Update task properties
    Object.assign(task, taskData);

    // Process assignee changes if provided
    if (taskData.assigneeIds) {
      const newAssignees = await userRepository.findBy({
        id: taskData.assigneeIds,
      });

      // Find new assignees who weren't previously assigned
      const previousAssigneeIds = task.assignees.map((a) => a.id);
      const brandNewAssignees = newAssignees.filter(
        (user) => !previousAssigneeIds.includes(user.id)
      );

      task.assignees = newAssignees;

      // Notify new assignees
      if (brandNewAssignees.length > 0) {
        await this.notifyAssignees(task, brandNewAssignees);
      }
    }

    const updatedTask = await taskRepository.save(task);

    // Notify existing assignees about the update
    if (task.assignees && task.assignees.length > 0) {
      for (const assignee of task.assignees) {
        await notificationService.createNotification({
          userId: assignee.id,
          type: "TASK_UPDATED",
          title: `Task Updated: ${task.title}`,
          message: `Task "${task.title}" has been updated`,
          entityId: task.id,
          entityType: "TASK",
          sendEmail: true,
        });
      }
    }

    // Log event
    await notificationService.logEvent({
      eventType: "TASK_UPDATED",
      userId: updaterId,
      targetId: updatedTask.id,
      targetType: "TASK",
      metadata: {
        title: updatedTask.title,
        changes: Object.keys(taskData),
      },
    });

    return updatedTask;
  }

  async updateTaskStage(taskId, stage, userId) {
    const taskRepository = AppDataSource.getRepository(Task);

    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ["assignees"],
    });

    if (!task) {
      throw new Error("Task not found");
    }

    task.stage = stage;
    const updatedTask = await taskRepository.save(task);

    // Broadcast task update via WebSocket
    socketService.broadcast("task-stage-updated", {
      taskId,
      stage,
      updatedAt: new Date(),
    });

    // Notify assignees
    if (task.assignees && task.assignees.length > 0) {
      for (const assignee of task.assignees) {
        await notificationService.createNotification({
          userId: assignee.id,
          type: "TASK_UPDATED",
          title: `Task Status Changed: ${task.title}`,
          message: `Task "${task.title}" has been moved to "${stage}"`,
          entityId: task.id,
          entityType: "TASK",
          sendEmail: stage === "completed", // Send email only for completion
        });
      }
    }

    // Log event
    await notificationService.logEvent({
      eventType: "TASK_UPDATED",
      userId,
      targetId: taskId,
      targetType: "TASK",
      metadata: {
        title: task.title,
        oldStage: task.stage,
        newStage: stage,
      },
    });

    return updatedTask;
  }

  // Helper to notify new assignees
  async notifyAssignees(task, assignees) {
    for (const assignee of assignees) {
      await notificationService.createNotification({
        userId: assignee.id,
        type: "TASK_ASSIGNED",
        title: `New Task Assigned: ${task.title}`,
        message: `You have been assigned to "${task.title}"`,
        entityId: task.id,
        entityType: "TASK",
        sendEmail: true,
      });
    }
  }

  async createSubTask(taskId, subTaskData, userId) {
    const taskRepository = AppDataSource.getRepository(Task);
    const subTaskRepository = AppDataSource.getRepository(SubTask);

    const task = await taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    const newSubTask = subTaskRepository.create({
      ...subTaskData,
      task,
    });

    const savedSubTask = await subTaskRepository.save(newSubTask);

    // Log event
    await notificationService.logEvent({
      eventType: "SUBTASK_CREATED",
      userId,
      targetId: savedSubTask.id,
      targetType: "SUBTASK",
      metadata: {
        title: savedSubTask.title,
        taskId: taskId,
      },
    });

    return savedSubTask;
  }

  async getTaskById(taskId) {
    if (!isValidUUID(taskId)) {
      throw new Error("Invalid task ID format");
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ["assignees", "creator", "subTasks", "comments", "assets"],
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }

  async updateTaskAssignees(taskId, assigneeIds) {
    const task = await this.getTaskById(taskId);

    const validAssigneeIds = filterValidUUIDs(assigneeIds);

    if (validAssigneeIds.length === 0) {
      task.assignees = [];
      return await AppDataSource.getRepository(Task).save(task);
    }

    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.findBy({ id: In(validAssigneeIds) });

    task.assignees = users;
    return await AppDataSource.getRepository(Task).save(task);
  }

  async createSimpleSubTask(taskId, subTaskData) {
    if (!isValidUUID(taskId)) {
      throw new Error("Invalid task ID format");
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({ where: { id: taskId } });

    if (!task) {
      throw new Error("Task not found");
    }

    const subTaskRepository = AppDataSource.getRepository(SubTask);
    const subTask = subTaskRepository.create({
      ...subTaskData,
      task: task,
    });

    return await subTaskRepository.save(subTask);
  }

  async updateTaskStatus(taskId, status) {
    const task = await this.getTaskById(taskId);

    const validStatuses = ["todo", "in progress", "completed"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status value");
    }

    task.stage = status;
    return await AppDataSource.getRepository(Task).save(task);
  }

  async deleteTask(taskId) {
    if (!isValidUUID(taskId)) {
      throw new Error("Invalid task ID format");
    }

    const taskRepository = AppDataSource.getRepository(Task);
    const result = await taskRepository.delete(taskId);

    if (result.affected === 0) {
      throw new Error("Task not found or already deleted");
    }

    return { success: true };
  }
}

module.exports = new TaskService();
