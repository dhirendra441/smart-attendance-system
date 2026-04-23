import { getStudentDashboard, markStudentAttendance, verifyAttendanceWindow } from "../services/attendanceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getStudentDashboardController = asyncHandler(async (req, res) => {
  const dashboard = await getStudentDashboard(req.user._id);

  res.json({
    success: true,
    data: dashboard
  });
});

export const verifyAttendanceWindowController = asyncHandler(async (req, res) => {
  const result = await verifyAttendanceWindow(req.params.sessionId, req.query.token, req.user);

  res.json({
    success: true,
    data: result
  });
});

export const markStudentAttendanceController = asyncHandler(async (req, res) => {
  const attendance = await markStudentAttendance(
    req.params.sessionId,
    req.body,
    {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || ""
    },
    req.user
  );

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully.",
    data: attendance
  });
});
