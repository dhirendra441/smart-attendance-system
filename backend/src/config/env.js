import dotenv from "dotenv";

dotenv.config();

const normalizeUrl = (value, fallback) => (value || fallback).replace(/\/$/, "");
const parseOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => normalizeUrl(origin, origin));

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb+srv://<username>:<password>@<cluster-url>/smart-attendance?retryWrites=true&w=majority",
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN || "http://localhost:5173"),
  frontendBaseUrl: normalizeUrl(process.env.FRONTEND_BASE_URL, "http://localhost:5173"),
  jwtSecret: process.env.JWT_SECRET || "smart-attendance-demo-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d"
};
