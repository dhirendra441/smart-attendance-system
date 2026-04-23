import { getCurrentUserProfile, loginUser } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const loginController = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  res.json({
    success: true,
    data: result
  });
});

export const meController = asyncHandler(async (req, res) => {
  const user = await getCurrentUserProfile(req.user._id);

  res.json({
    success: true,
    data: user
  });
});
