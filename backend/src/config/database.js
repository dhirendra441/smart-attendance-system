import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};
