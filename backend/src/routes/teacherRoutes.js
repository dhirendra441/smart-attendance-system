import { Router } from "express";
import {
  closeTeacherSessionController,
  createTeacherSessionController,
  deleteTeacherSessionController,
  getTeacherDashboardController,
  getTeacherSessionAttendanceController,
  getTeacherSessionController,
  getTeacherSessionIncidentsController,
  getTeacherTodaySessionsController,
  listTeacherSessionsController
} from "../controllers/teacherController.js";
import {
  createTeacherScheduleController,
  deleteTeacherScheduleController,
  listTeacherSchedulesController,
  updateTeacherScheduleController
} from "../controllers/scheduleController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, requireRole("teacher"));

router.get("/dashboard/summary", getTeacherDashboardController);
router.get("/sessions/today", getTeacherTodaySessionsController);
router.route("/sessions").get(listTeacherSessionsController).post(createTeacherSessionController);
router.get("/sessions/:sessionId", getTeacherSessionController);
router.patch("/sessions/:sessionId/close", closeTeacherSessionController);
router.delete("/sessions/:sessionId", deleteTeacherSessionController);
router.get("/sessions/:sessionId/attendance", getTeacherSessionAttendanceController);
router.get("/sessions/:sessionId/incidents", getTeacherSessionIncidentsController);
router.route("/schedules").get(listTeacherSchedulesController).post(createTeacherScheduleController);
router.route("/schedules/:scheduleId").patch(updateTeacherScheduleController).delete(deleteTeacherScheduleController);

export default router;
