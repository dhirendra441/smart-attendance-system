import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const comparePassword = async (password, passwordHash) => bcrypt.compare(password, passwordHash);

export const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
