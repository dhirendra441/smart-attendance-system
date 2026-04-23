import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { ensureDemoUsers } from "./services/demoUserService.js";
import { startScheduleAutomation } from "./services/scheduleService.js";
import { app } from "./app.js";

const printMongoTroubleshooting = (error) => {
  const isConnectionRefused =
    error?.name === "MongooseServerSelectionError" &&
    JSON.stringify(error).includes("ECONNREFUSED");

  if (!isConnectionRefused) {
    return;
  }

  console.error("");
  console.error("MongoDB is not reachable.");
  console.error(`Expected connection string: ${env.mongoUri}`);
  console.error("Make sure your MongoDB Atlas connection string is correct and your IP is allowed in Atlas.");
  console.error("If backend/.env is missing, create it from backend/.env.example first.");
  console.error("");
  console.error("Example backend/.env:");
  console.error("PORT=5000");
  console.error("MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/smart-attendance?retryWrites=true&w=majority");
  console.error("CLIENT_ORIGIN=http://localhost:5173");
  console.error("FRONTEND_BASE_URL=http://localhost:5173");
  console.error("JWT_SECRET=replace-this-with-a-long-random-secret");
  console.error("JWT_EXPIRES_IN=7d");
  console.error("");
};

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureDemoUsers();
    startScheduleAutomation();

    const server = app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${env.port} is already in use. Another backend instance is probably already running.`);
        console.error("Stop the old process or change PORT in backend/.env before starting a new one.");
        process.exit(1);
      }

      throw error;
    });
  } catch (error) {
    printMongoTroubleshooting(error);
    console.error("Failed to start the server.", error);
    process.exit(1);
  }
};

startServer();
