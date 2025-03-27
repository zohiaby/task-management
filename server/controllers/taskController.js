import asyncHandler from "express-async-handler";
import taskService from "../services/taskService.js";
import notificationService from "../services/notificationService.js";
import { AppDataSource } from "../config/database.js";
import Task from "../models/postgres/Task.js";
import SubTask from "../models/postgres/SubTask.js";
import User from "../models/postgres/User.js";
import Asset from "../models/postgres/Asset.js";
import socketService from "../services/socketService.js";
import { isValidUUID } from "../utils/validators.js";
import { In } from "typeorm"; // Add this import for the In operator

// Helper function to extract and limit fileType length
const getFileType = (url) => {
  // Extract file extension
  const extension = url.split(".").pop().split("?")[0];
  // Limit to 45 characters to be safe (50 is the DB limit)
  return extension.substring(0, 45);
};

// Create a new task
const createTask = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      team,
      stage,
      priority,
      assets = [],
      links = "",
    } = req.body;
    const { id: userId } = req.user;

    // Create task first without assets
    const taskRepository = AppDataSource.getRepository(Task);
    const userRepository = AppDataSource.getRepository(User);
    const assetRepository = AppDataSource.getRepository(Asset);

    // Find creator
    const creator = await userRepository.findOne({ where: { id: userId } });
    if (!creator) {
      return res.status(400).json({ status: false, message: "Invalid user." });
    }

    // Find assignees
    const assignees = await userRepository.find({
      where: { id: In(team) }, // This now works with the proper import
    });

    // Create task without assets initially
    const newTask = taskRepository.create({
      title,
      description,
      date,
      stage,
      priority,
      links,
      creator,
      assignees,
    });

    await taskRepository.save(newTask);

    // Then create and link assets
    if (assets && assets.length > 0) {
      for (const assetUrl of assets) {
        const asset = assetRepository.create({
          name: assetUrl.split("/").pop(),
          fileUrl: assetUrl,
          fileType: getFileType(assetUrl),
          task: newTask,
          uploader: creator,
        });
        await assetRepository.save(asset);
      }
    }

    // Fetch the complete task with relationships
    const completedTask = await taskRepository.findOne({
      where: { id: newTask.id },
      relations: ["assignees", "creator", "assets"],
    });

    // Log task creation
    await notificationService.logEvent({
      eventType: "TASK_CREATED",
      userId,
      targetType: "TASK",
      targetId: newTask.id,
      metadata: {
        taskTitle: title,
      },
    });

    return res.status(201).json({
      status: true,
      message: "Task created successfully!",
      task: completedTask,
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Duplicate an existing task
const duplicateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const taskRepository = AppDataSource.getRepository(Task);

    // Get original task with relations
    const originalTask = await taskRepository.findOne({
      where: { id },
      relations: ["assignees", "subTasks"],
    });

    if (!originalTask) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Create a new task based on original
    const newTask = taskRepository.create({
      title: "Duplicate - " + originalTask.title,
      description: originalTask.description,
      priority: originalTask.priority,
      stage: originalTask.stage,
      dueDate: originalTask.dueDate,
    });

    // Set creator as current user
    const userRepository = AppDataSource.getRepository(User);
    const creator = await userRepository.findOne({ where: { id: userId } });
    newTask.creator = creator;

    // Save the new task first to get an ID
    const savedTask = await taskRepository.save(newTask);

    // Add the assignees
    if (originalTask.assignees && originalTask.assignees.length > 0) {
      savedTask.assignees = originalTask.assignees;
      await taskRepository.save(savedTask);
    }

    // Duplicate subtasks
    const subTaskRepository = AppDataSource.getRepository(SubTask);
    if (originalTask.subTasks && originalTask.subTasks.length > 0) {
      for (const subTask of originalTask.subTasks) {
        await subTaskRepository.save({
          title: subTask.title,
          tag: subTask.tag,
          isCompleted: false,
          task: savedTask,
        });
      }
    }

    // Notify assignees
    if (savedTask.assignees) {
      await taskService.notifyAssignees(savedTask, savedTask.assignees);
    }

    // Log activity
    await notificationService.logEvent({
      eventType: "TASK_CREATED",
      userId,
      targetId: savedTask.id,
      targetType: "TASK",
      metadata: {
        title: savedTask.title,
        duplicatedFrom: id,
      },
    });

    res.status(200).json({
      status: true,
      message: "Task duplicated successfully.",
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
});

// Update a task
const updateTask = asyncHandler(async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      date,
      team,
      stage,
      priority,
      assets = [],
      links,
    } = req.body;
    const { id: userId } = req.user;

    const taskRepository = AppDataSource.getRepository(Task);
    const userRepository = AppDataSource.getRepository(User);
    const assetRepository = AppDataSource.getRepository(Asset);

    // Fetch existing task
    let task = await taskRepository.findOne({
      where: { id },
      relations: ["assignees", "creator", "assets"],
    });

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found!",
      });
    }

    // Find assignees
    const assignees =
      team && team.length > 0
        ? await userRepository.find({ where: { id: In(team) } }) // This now works with the proper import
        : task.assignees;

    // Update task properties
    task.title = title || task.title;
    task.description = description || task.description;
    task.date = date || task.date;
    task.stage = stage || task.stage;
    task.priority = priority || task.priority;
    task.links = links !== undefined ? links : task.links;
    task.assignees = assignees;

    await taskRepository.save(task);

    // Handle assets separately - first remove old assets if new ones provided
    if (assets && assets.length > 0) {
      // Get existing asset URLs
      const existingAssetUrls = task.assets.map((asset) => asset.fileUrl);

      // Find new assets not in existing ones
      const newAssets = assets.filter(
        (url) => !existingAssetUrls.includes(url)
      );

      // Create new assets
      for (const assetUrl of newAssets) {
        const asset = assetRepository.create({
          name: assetUrl.split("/").pop(),
          fileUrl: assetUrl,
          fileType: getFileType(assetUrl),
          task: task,
          uploader: { id: userId },
        });
        await assetRepository.save(asset);
      }
    }

    // Fetch the updated task with all relations
    const updatedTask = await taskRepository.findOne({
      where: { id },
      relations: ["assignees", "creator", "assets"],
    });

    // Log task update
    await notificationService.logEvent({
      eventType: "TASK_UPDATED",
      userId,
      targetType: "TASK",
      targetId: id,
      metadata: {
        taskTitle: title || task.title,
      },
    });

    return res.status(200).json({
      status: true,
      message: "Task updated successfully!",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Update task stage
const updateTaskStage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const userId = req.user.id;

    const updatedTask = await taskService.updateTaskStage(
      id,
      stage.toLowerCase(),
      userId
    );

    res.status(200).json({
      status: true,
      message: "Task stage changed successfully.",
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Update subtask completion status
const updateSubTaskStage = asyncHandler(async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const subTaskRepository = AppDataSource.getRepository(SubTask);
    const subTask = await subTaskRepository.findOne({
      where: { id: subTaskId },
      relations: ["task"],
    });

    if (!subTask) {
      return res
        .status(404)
        .json({ status: false, message: "Subtask not found" });
    }

    subTask.isCompleted = status;
    await subTaskRepository.save(subTask);

    // Log event
    await notificationService.logEvent({
      eventType: "SUBTASK_UPDATED",
      userId,
      targetId: subTaskId,
      targetType: "SUBTASK",
      metadata: {
        taskId,
        completed: status,
      },
    });

    // Notify assignees of the parent task
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: taskId },
      relations: ["assignees"],
    });

    if (task && task.assignees) {
      for (const assignee of task.assignees) {
        if (assignee.id !== userId) {
          await notificationService.createNotification({
            userId: assignee.id,
            type: "TASK_UPDATED",
            title: `Subtask Updated in "${task.title}"`,
            message: `A subtask has been marked as ${
              status ? "completed" : "incomplete"
            }.`,
            entityId: taskId,
            entityType: "TASK",
          });
        }
      }
    }

    res.status(200).json({
      status: true,
      message: status
        ? "Task has been marked completed"
        : "Task has been marked uncompleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Create a subtask
const createSubTask = asyncHandler(async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    const subTaskData = {
      title,
      tag,
      date,
    };

    const newSubTask = await taskService.createSubTask(id, subTaskData, userId);

    res.status(200).json({
      status: true,
      message: "SubTask added successfully.",
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Get tasks with filtering
const getTasks = asyncHandler(async (req, res) => {
  try {
    console.log("Getting tasks with query:", req.query); // Add debugging

    const {
      stage = "",
      isTrashed = false,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Create query builder
    const taskRepository = AppDataSource.getRepository(Task);
    let queryBuilder = taskRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.assignees", "assignees")
      .leftJoinAndSelect("task.creator", "creator");

    // Apply filters
    if (stage && stage !== "all") {
      // Handle different stage formats more flexibly
      let stageValue = stage.toLowerCase();

      // Map common stage names to their database values
      const stageMapping = {
        todo: "todo",
        "in progress": "in progress",
        inprogress: "in progress",
        progress: "in progress",
        done: "completed",
        completed: "completed",
      };

      const normalizedStage = stageMapping[stageValue] || stageValue;

      // Log the normalized stage for debugging
      console.log(
        `Filtering by stage: Original="${stage}", Normalized="${normalizedStage}"`
      );

      // Use ILIKE for case-insensitive matching
      queryBuilder = queryBuilder.andWhere("LOWER(task.stage) ILIKE :stage", {
        stage: `%${normalizedStage}%`,
      });
    }

    // Fix the column name from isTrashed to isDeleted
    if (isTrashed === "true") {
      queryBuilder = queryBuilder.andWhere("task.isDeleted = true");
    } else {
      queryBuilder = queryBuilder.andWhere("task.isDeleted = false");
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        "(task.title ILIKE :search OR task.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Filter by user permissions - if not admin, show only assigned tasks
    if (!isAdmin) {
      queryBuilder = queryBuilder
        .innerJoin("task.assignees", "userAssignee")
        .andWhere("userAssignee.id = :userId", { userId });
    }

    // Add pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder
      .orderBy("task.createdAt", "DESC")
      .skip(skip)
      .take(parseInt(limit));

    // Debug the SQL that will be executed
    const sql = queryBuilder.getSql();
    console.log("Generated SQL:", sql);

    // Execute query
    const [tasks, total] = await queryBuilder.getManyAndCount();

    console.log(`Found ${tasks.length} tasks out of ${total} total`); // Debug log

    // If no tasks found, try to investigate stage values in database
    if (tasks.length === 0 && stage && stage !== "all") {
      const availableStages = await taskRepository
        .createQueryBuilder("task")
        .select("DISTINCT task.stage", "stage")
        .getRawMany();

      console.log("Available stages in database:", availableStages);
    }

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single task by ID
const getTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id },
      relations: [
        "assignees",
        "creator",
        "subTasks",
        "comments",
        "comments.author",
        "assets",
      ],
    });

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to fetch task" });
  }
});

// Post activity to a task
const postTaskActivity = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { type, activity } = req.body;

    // Note: This is now handled by the event logging system
    await notificationService.logEvent({
      eventType: "TASK_UPDATED",
      userId,
      targetId: id,
      targetType: "TASK",
      metadata: {
        activityType: type,
        activity,
      },
    });

    // Notify task assignees
    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id },
      relations: ["assignees"],
    });

    if (task && task.assignees) {
      for (const assignee of task.assignees) {
        if (assignee.id !== userId) {
          await notificationService.createNotification({
            userId: assignee.id,
            type: "TASK_UPDATED",
            title: `Activity on "${task.title}"`,
            message: activity,
            entityId: id,
            entityType: "TASK",
          });
        }
      }
    }

    res.status(200).json({
      status: true,
      message: "Activity posted successfully.",
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Move task to trash
const trashTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const taskRepository = AppDataSource.getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.isDeleted = true;
    await taskRepository.save(task);

    // Log event
    await notificationService.logEvent({
      eventType: "TASK_DELETED",
      userId,
      targetId: id,
      targetType: "TASK",
      metadata: {
        title: task.title,
        trash: true,
      },
    });

    res.status(200).json({
      status: true,
      message: `Task trashed successfully.`,
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Delete or restore tasks
const deleteRestoreTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;
    const userId = req.user.id;

    const taskRepository = AppDataSource.getRepository(Task);

    if (actionType === "delete") {
      const task = await taskRepository.findOne({ where: { id } });
      if (!task) {
        return res
          .status(404)
          .json({ status: false, message: "Task not found" });
      }
      await taskRepository.remove(task);

      // Log permanent deletion
      await notificationService.logEvent({
        eventType: "TASK_DELETED",
        userId,
        targetId: id,
        targetType: "TASK",
        metadata: {
          permanent: true,
        },
      });
    } else if (actionType === "deleteAll") {
      const trashedTasks = await taskRepository.find({
        where: { isDeleted: true },
      });
      await taskRepository.remove(trashedTasks);

      // Log bulk deletion
      await notificationService.logEvent({
        eventType: "SYSTEM_EVENT",
        userId,
        targetType: "SYSTEM",
        metadata: {
          action: "bulk-delete",
          count: trashedTasks.length,
        },
      });
    } else if (actionType === "restore") {
      const task = await taskRepository.findOne({ where: { id } });
      if (!task) {
        return res
          .status(404)
          .json({ status: false, message: "Task not found" });
      }
      task.isDeleted = false;
      await taskRepository.save(task);

      // Log restoration
      await notificationService.logEvent({
        eventType: "TASK_UPDATED",
        userId,
        targetId: id,
        targetType: "TASK",
        metadata: {
          restored: true,
        },
      });
    } else if (actionType === "restoreAll") {
      await taskRepository.update({ isDeleted: true }, { isDeleted: false });

      // Log bulk restoration
      await notificationService.logEvent({
        eventType: "SYSTEM_EVENT",
        userId,
        targetType: "SYSTEM",
        metadata: {
          action: "bulk-restore",
        },
      });
    }

    res.status(200).json({
      status: true,
      message: `Operation performed successfully.`,
    });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Dashboard statistics
const dashboardStatistics = asyncHandler(async (req, res) => {
  try {
    const { id, role } = req.user;
    const isAdmin = role === "admin";

    const taskRepository = AppDataSource.getRepository(Task);
    const userRepository = AppDataSource.getRepository(User);

    // Tasks query
    let tasksQuery = taskRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.assignees", "assignee")
      .leftJoinAndSelect("task.creator", "creator")
      .where("task.isDeleted = :isDeleted", { isDeleted: false });

    if (!isAdmin) {
      tasksQuery = tasksQuery.andWhere("assignee.id = :userId", { userId: id });
    }

    const allTasks = await tasksQuery.getMany();

    // Get recent users for admin
    const users = isAdmin
      ? await userRepository.find({
          where: { isActive: true },
          select: ["id", "name", "role", "isActive", "createdAt"],
          take: 10,
          order: { createdAt: "DESC" },
        })
      : [];

    // Group tasks by stage
    const groupedTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;
      result[stage] = (result[stage] || 0) + 1;
      return result;
    }, {});

    // Calculate priority distribution for graph
    const graphData = Object.entries(
      allTasks.reduce((result, task) => {
        const priority = task.priority;
        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // Get the 10 most recent tasks
    const last10Task = allTasks
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    // Combine results into a summary
    const summary = {
      totalTasks: allTasks.length,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupedTasks,
      graphData,
    };

    res.status(200).json({
      status: true,
      ...summary,
      message: "Successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Update task status
const updateTaskStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid task ID format",
      });
    }

    const updatedTask = await taskService.updateTaskStatus(id, status);
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// Add a subtask
const addSubTask = asyncHandler(async (req, res) => {
  try {
    const { taskId } = req.params;
    const subTaskData = req.body;

    if (!isValidUUID(taskId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid task ID format",
      });
    }

    const newSubTask = await taskService.createSubTask(taskId, subTaskData);
    res.status(201).json(newSubTask);
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// Delete a task
const deleteTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid task ID format",
      });
    }

    await taskService.deleteTask(id);
    res.status(200).json({
      status: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

export {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateSubTaskStage,
  updateTask,
  updateTaskStage,
  updateTaskStatus,
  addSubTask,
  deleteTask,
};
