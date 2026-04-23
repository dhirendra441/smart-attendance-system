import { Router } from "express";
import {
  getStudentDashboardController,
  markStudentAttendanceController,
  verifyAttendanceWindowController
} from "../controllers/studentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.get("/dashboard", getStudentDashboardController);
router.get("/attendance/:sessionId/verify", verifyAttendanceWindowController);
router.post("/attendance/:sessionId/mark", markStudentAttendanceController);

export default router;
