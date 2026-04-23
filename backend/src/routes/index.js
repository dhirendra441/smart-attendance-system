import { Router } from "express";
import authRoutes from "./authRoutes.js";
import publicAttendanceRoutes from "./publicAttendanceRoutes.js";
import studentRoutes from "./studentRoutes.js";
import teacherRoutes from "./teacherRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Attendance API is running."
  });
});

router.use("/auth", authRoutes);
router.use("/teacher", teacherRoutes);
router.use("/student", studentRoutes);
router.use("/public/attendance", publicAttendanceRoutes);

export default router;
