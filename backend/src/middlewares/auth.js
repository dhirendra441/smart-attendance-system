import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization || "";
    const token = authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.replace("Bearer ", "")
      : "";

    if (!token) {
      throw new AppError("Authentication required.", 401);
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      throw new AppError("Authenticated user was not found.", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(new AppError("Invalid or expired token.", 401));
      return;
    }

    next(error);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to access this resource.", 403));
  }

  return next();
};
