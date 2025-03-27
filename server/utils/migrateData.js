import mongoose from "mongoose";
import { AppDataSource } from "../config/database.js";
import { hashPassword } from "../models/postgres/User.js";
import User from "../models/postgres/User.js";
import Task from "../models/postgres/Task.js";
import SubTask from "../models/postgres/SubTask.js";

// This function can be called manually to migrate data from MongoDB to PostgreSQL
export async function migrateMongoToPostgres() {
  console.log("Starting data migration from MongoDB to PostgreSQL...");

  try {
    // 1. Migrate users
    console.log("Migrating users...");
    const mongoUsers = await mongoose.connection.db
      .collection("users")
      .find({})
      .toArray();
    const userRepository = AppDataSource.getRepository(User);

    const userMap = new Map(); // To store MongoDB _id -> PostgreSQL id mapping

    for (const mongoUser of mongoUsers) {
      // Check if user already exists in PostgreSQL
      let pgUser = await userRepository.findOne({
        where: { email: mongoUser.email },
      });

      if (!pgUser) {
        // Create new user in PostgreSQL
        const hashedPwd = await hashPassword(
          mongoUser.password || "password123"
        );

        pgUser = userRepository.create({
          name: mongoUser.name,
          email: mongoUser.email,
          password: hashedPwd,
          role: mongoUser.isAdmin ? "admin" : "user",
          isAdmin: mongoUser.isAdmin,
          isActive: mongoUser.isActive !== false,
          avatar: mongoUser.avatar,
        });

        pgUser = await userRepository.save(pgUser);
        console.log(`Migrated user: ${pgUser.email}`);
      }

      userMap.set(mongoUser._id.toString(), pgUser.id);
    }

    // 2. Migrate tasks
    console.log("Migrating tasks...");
    const mongoTasks = await mongoose.connection.db
      .collection("tasks")
      .find({})
      .toArray();
    const taskRepository = AppDataSource.getRepository(Task);
    const subTaskRepository = AppDataSource.getRepository(SubTask);

    for (const mongoTask of mongoTasks) {
      // Skip already migrated tasks
      const existingTask = await taskRepository.findOne({
        where: { title: mongoTask.title },
      });

      if (existingTask) {
        continue;
      }

      // Get creator ID from mapping
      let creatorId = null;
      if (mongoTask.creator) {
        creatorId = userMap.get(mongoTask.creator.toString());
      }

      // Create new task
      const newTask = taskRepository.create({
        title: mongoTask.title,
        description: mongoTask.description,
        priority: mongoTask.priority || "medium",
        stage: mongoTask.stage || "todo",
        isDeleted: mongoTask.isTrashed || false,
        dueDate: mongoTask.date ? new Date(mongoTask.date) : null,
      });

      // Add creator if available
      if (creatorId) {
        const creator = await userRepository.findOne({
          where: { id: creatorId },
        });
        if (creator) {
          newTask.creator = creator;
        }
      }

      // Save task first
      const savedTask = await taskRepository.save(newTask);

      // Add assignees (team members)
      if (mongoTask.team && mongoTask.team.length > 0) {
        const assigneeIds = mongoTask.team
          .map((id) => userMap.get(id.toString()))
          .filter(Boolean);
        const assignees = await userRepository.findBy({ id: assigneeIds });

        if (assignees.length > 0) {
          savedTask.assignees = assignees;
          await taskRepository.save(savedTask);
        }
      }

      // Migrate subtasks
      if (mongoTask.subTasks && mongoTask.subTasks.length > 0) {
        for (const mongoSubTask of mongoTask.subTasks) {
          const newSubTask = subTaskRepository.create({
            title: mongoSubTask.title,
            isCompleted: mongoSubTask.isCompleted || false,
            tag: mongoSubTask.tag,
            task: savedTask,
          });

          await subTaskRepository.save(newSubTask);
        }
      }

      console.log(`Migrated task: ${savedTask.title}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
