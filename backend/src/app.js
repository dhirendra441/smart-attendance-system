import cors from "cors";
import express from "express";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import routes from "./routes/index.js";

export const app = express();

app.set("trust proxy", true);

// ✅ CORS CONFIG (robust + production safe)
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map(o => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like Postman / server-to-server
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// ✅ IMPORTANT: handle preflight requests
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

// routes AFTER cors
app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);