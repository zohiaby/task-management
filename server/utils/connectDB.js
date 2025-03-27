import { connectMongoDB, initializePostgresDB } from "../config/database.js";

const dbConnection = async () => {
  try {
    // Connect to MongoDB for event/notification logging
    await connectMongoDB();

    // Connect to PostgreSQL for main application data
    await initializePostgresDB();

    console.log("All database connections established successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default dbConnection;
