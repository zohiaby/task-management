// import mongoose from "mongoose";
// import { DataSource } from "typeorm";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// // Load env variables
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "..", ".env") });

// // Default MongoDB URL if environment variable is not set
// const DEFAULT_MONGODB_URL =
//   "mongodb://zohaib:zohaib@44.211.75.73:27017/taskmanagement?authSource=admin";

// // MongoDB Connection
// export const connectMongoDB = async () => {
//   try {
//     const mongoUrl = process.env.MONGODB_URL || DEFAULT_MONGODB_URL;
//     console.log("Connecting to MongoDB at:", mongoUrl);
//     const conn = await mongoose.connect(mongoUrl);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//     return conn;
//   } catch (error) {
//     console.error(`Error connecting to MongoDB: ${error.message}`);
//     process.exit(1);
//   }
// };

// // PostgreSQL Connection with TypeORM
// export const AppDataSource = new DataSource({
//   type: "postgres",
//   host: process.env.POSTGRES_HOST || "44.211.75.73",
//   port: parseInt(process.env.POSTGRES_PORT || "5432"),
//   username: process.env.POSTGRES_USER || "zohaib",
//   password: process.env.POSTGRES_PASSWORD || "zohaib",
//   database: process.env.POSTGRES_DB || "taskmanagement",
//   synchronize: process.env.NODE_ENV === "development", // Only true in development
//   logging: process.env.NODE_ENV === "development",
//   entities: [path.join(__dirname, "../models/postgres/**/*.js")],
//   // Add fallback entity paths in case the above doesn't work
//   // This helps if you're running from a different directory
//   migrations: [],
// });

// export const initializePostgresDB = async () => {
//   try {
//     await AppDataSource.initialize();
//     console.log("PostgreSQL Data Source has been initialized!");
//     return AppDataSource;
//   } catch (error) {
//     console.error("Error during PostgreSQL Data Source initialization:", error);
//     process.exit(1);
//   }
// };

// export default { connectMongoDB, initializePostgresDB };

const mongoose = require("mongoose");
const { DataSource } = require("typeorm");
const dotenv = require("dotenv");
const path = require("path");

// Load env variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Default MongoDB URL if environment variable is not set
const DEFAULT_MONGODB_URL =
  "mongodb://zohaib:zohaib@44.211.75.73:27017/taskmanagement?authSource=admin";

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || DEFAULT_MONGODB_URL;
    console.log("Connecting to MongoDB at:", mongoUrl);
    const conn = await mongoose.connect(mongoUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// PostgreSQL Connection with TypeORM
const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "44.211.75.73",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "zohaib",
  password: process.env.POSTGRES_PASSWORD || "zohaib",
  database: process.env.POSTGRES_DB || "taskmanagement",
  synchronize: process.env.NODE_ENV === "development", // Only true in development
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "../models/postgres/**/*.js")],
  migrations: [],
});

const initializePostgresDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log("PostgreSQL Data Source has been initialized!");
    return AppDataSource;
  } catch (error) {
    console.error("Error during PostgreSQL Data Source initialization:", error);
    process.exit(1);
  }
};

module.exports = { connectMongoDB, initializePostgresDB };
