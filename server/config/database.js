const mongoose = require("mongoose");
const { DataSource } = require("typeorm");
const dotenv = require("dotenv");
const path = require("path");
const net = require("net");

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

// Function to test TCP connection to PostgreSQL server
const testPgConnection = (host, port) => {
  return new Promise((resolve, reject) => {
    console.log(`Testing TCP connection to ${host}:${port}...`);

    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Connection timeout to ${host}:${port}`));
    }, 5000);

    socket.on("connect", () => {
      clearTimeout(timeout);
      socket.end();
      console.log(`Successfully connected to ${host}:${port}`);
      resolve(true);
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      console.error(`Connection test failed: ${err.message}`);
      reject(err);
    });
  });
};

// Ensure PostgreSQL port is properly defined
const pgHost = process.env.POSTGRES_HOST || "44.211.75.73";
const pgPort = process.env.POSTGRES_PORT
  ? parseInt(process.env.POSTGRES_PORT, 10)
  : 5432;
console.log(`Using PostgreSQL host: ${pgHost}, port: ${pgPort}`);

// PostgreSQL Connection with TypeORM
const AppDataSource = new DataSource({
  type: "postgres",
  host: pgHost,
  port: pgPort, // Use our explicitly defined port
  username: process.env.POSTGRES_USER || "zohaib",
  password: process.env.POSTGRES_PASSWORD || "zohaib",
  database: process.env.POSTGRES_DB || "taskmanagement",
  synchronize: process.env.NODE_ENV === "development", // Only true in development
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "../models/postgres/**/*.js")],
  migrations: [],
  // Explicitly disable SSL for development to avoid connection issues
  ssl: false,
  extra: {
    // Add connection troubleshooting timeout options
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  },
});

const initializePostgresDB = async () => {
  try {
    // Test TCP connection before attempting TypeORM connection
    await testPgConnection(pgHost, pgPort);

    // Log connection info for debugging
    console.log(`Attempting PostgreSQL connection to ${pgHost}:${pgPort}`);
    console.log(
      `Database name: ${AppDataSource.options.database}, Username: ${AppDataSource.options.username}`
    );

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("PostgreSQL Data Source has been initialized!");
    } else {
      console.log("PostgreSQL Data Source already initialized");
    }
    return AppDataSource;
  } catch (error) {
    console.error("Error during PostgreSQL Data Source initialization:", error);
    throw error; // Let the caller handle the error
  }
};

module.exports = { connectMongoDB, initializePostgresDB, AppDataSource };
