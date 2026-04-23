import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { signToken, comparePassword } from "../utils/auth.js";
import { normalizeText } from "../utils/normalize.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  phoneNumber: user.phoneNumber,
  role: user.role,
  rollNumber: user.rollNumber,
  section: user.section,
  department: user.department,
  isDemo: user.isDemo
});

export const loginUser = async ({ phoneNumber, password }) => {
  const normalizedIdentifier = normalizeText(phoneNumber);

  if (!normalizedIdentifier || !password) {
    throw new AppError("Roll number or phone number and password are required.", 400);
  }

  const user = await User.findOne({
    $or: [{ phoneNumber: normalizedIdentifier }, { rollNumber: normalizedIdentifier }]
  });

  if (!user) {
    throw new AppError("Invalid roll number, phone number, or password.", 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid roll number, phone number, or password.", 401);
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user)
  };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return sanitizeUser(user);
};
