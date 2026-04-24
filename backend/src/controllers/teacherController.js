import {
  getTeacherDashboardSummary,
  getTeacherSessionAttendance,
  getTeacherSessionIncidents
} from "../services/attendanceService.js";
import {
  closeTeacherSession,
  createTeacherSession,
  deleteTeacherSession,
  getTeacherSessionByPublicId,
  listTeacherSessions
} from "../services/sessionService.js";
import { getTeacherTodaySessions } from "../services/scheduleService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getTeacherDashboardController = asyncHandler(async (req, res) => {
  const summary = await getTeacherDashboardSummary(req.user._id);

  res.json({
    success: true,
    data: summary
  });
});

export const createTeacherSessionController = asyncHandler(async (req, res) => {
  const session = await createTeacherSession(req.body, req.user);

  res.status(201).json({
    success: true,
    data: session
  });
});

export const listTeacherSessionsController = asyncHandler(async (req, res) => {
  const sessions = await listTeacherSessions(req.user._id);

  res.json({
    success: true,
    data: sessions
  });
});

export const getTeacherSessionController = asyncHandler(async (req, res) => {
  const session = await getTeacherSessionByPublicId(req.params.sessionId, req.user._id);

  res.json({
    success: true,
    data: session
  });
});

export const closeTeacherSessionController = asyncHandler(async (req, res) => {
  const session = await closeTeacherSession(req.params.sessionId, req.user._id);

  res.json({
    success: true,
    data: session
  });
});

export const deleteTeacherSessionController = asyncHandler(async (req, res) => {
  await deleteTeacherSession(req.params.sessionId, req.user._id);

  res.json({
    success: true,
    message: "Session deleted successfully."
  });
});

export const getTeacherSessionAttendanceController = asyncHandler(async (req, res) => {
  const response = await getTeacherSessionAttendance(req.params.sessionId, req.user._id);

  res.json({
    success: true,
    data: {
      session: response.session,
      attendance: response.records,
      absentStudents: response.absentStudents,
      stats: response.stats
    }
  });
});

export const getTeacherSessionIncidentsController = asyncHandler(async (req, res) => {
  const response = await getTeacherSessionIncidents(req.params.sessionId, req.user._id);

  res.json({
    success: true,
    data: {
      session: response.session,
      incidents: response.incidents
    }
  });
});

export const getTeacherTodaySessionsController = asyncHandler(async (req, res) => {
  const sessions = await getTeacherTodaySessions(req.user._id);

  res.json({
    success: true,
    data: sessions
  });
});
