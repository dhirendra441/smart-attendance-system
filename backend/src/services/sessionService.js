import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { AttendanceIncident } from "../models/AttendanceIncident.js";
import { AttendanceRecord } from "../models/AttendanceRecord.js";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { normalizeText } from "../utils/normalize.js";

const buildAttendanceLink = (session) =>
  `${env.frontendBaseUrl}/attendance/${session.publicSessionId}?token=${encodeURIComponent(
    session.qrToken
  )}&issuedAt=${encodeURIComponent(session.startedAt.toISOString())}&expiresAt=${encodeURIComponent(
    session.expiresAt.toISOString()
  )}`;

const buildQrPayload = (session) => ({
  sessionIdentifier: session.publicSessionId,
  timestamp: session.startedAt.toISOString(),
  expiryTime: session.expiresAt.toISOString(),
  qrToken: session.qrToken,
  attendanceUrl: buildAttendanceLink(session)
});

const buildQrCodeDataUrl = async (session) =>
  QRCode.toDataURL(buildAttendanceLink(session), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320
  });

const serializeTeacherIdentity = (teacher) =>
  teacher
    ? {
        id: teacher._id,
        name: teacher.name,
        phoneNumber: teacher.phoneNumber,
        department: teacher.department
      }
    : undefined;

const serializeTeacherSession = async (session, metrics = {}) => ({
  ...session.toObject(),
  teacher: serializeTeacherIdentity(session.teacher),
  attendanceCount: metrics.attendanceCount || 0,
  incidentCount: metrics.incidentCount || 0,
  presentCount: metrics.presentCount || 0,
  suspiciousCount: metrics.suspiciousCount || 0,
  totalStudents: metrics.totalStudents || 0,
  absentCount: metrics.absentCount || 0,
  attendanceLink: buildAttendanceLink(session),
  qrPayload: buildQrPayload(session),
  qrCodeDataUrl: await buildQrCodeDataUrl(session)
});

const aggregateRosterStats = async (sections) => {
  const normalizedSections = [...new Set(sections.map((section) => normalizeText(section || "")).filter(Boolean))];

  if (!normalizedSections.length) {
    return new Map();
  }

  const rosterRecords = await User.aggregate([
    {
      $match: {
        role: "student",
        section: { $in: normalizedSections }
      }
    },
    {
      $group: {
        _id: "$section",
        count: { $sum: 1 }
      }
    }
  ]);

  return new Map(rosterRecords.map((item) => [normalizeText(item._id || ""), item.count]));
};

const buildMetricsMap = (items, attendanceStats, incidentStats, rosterStats) =>
  new Map(
    items.map((session) => {
      const sessionId = String(session._id);
      const attendance = attendanceStats.get(sessionId) || 0;
      const incidents = incidentStats.get(sessionId) || 0;
      const totalStudents = rosterStats.get(normalizeText(session.section || "")) || 0;

      return [
        sessionId,
        {
          attendanceCount: attendance,
          incidentCount: incidents,
          presentCount: attendance,
          suspiciousCount: incidents,
          totalStudents,
          absentCount: Math.max(totalStudents - attendance, 0)
        }
      ];
    })
  );

const aggregateSessionStats = async (sessionIds) => {
  if (!sessionIds.length) {
    return {
      attendanceStats: new Map(),
      incidentStats: new Map()
    };
  }

  const [attendanceRecords, incidentRecords] = await Promise.all([
    AttendanceRecord.aggregate([
      { $match: { session: { $in: sessionIds } } },
      {
        $group: {
          _id: "$session",
          count: { $sum: 1 }
        }
      }
    ]),
    AttendanceIncident.aggregate([
      { $match: { session: { $in: sessionIds } } },
      {
        $group: {
          _id: "$session",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    attendanceStats: new Map(attendanceRecords.map((item) => [String(item._id), item.count])),
    incidentStats: new Map(incidentRecords.map((item) => [String(item._id), item.count]))
  };
};

export const hydrateTeacherSessionsWithMetrics = async (sessions) => {
  const sessionIds = sessions.map((session) => session._id);
  const [sessionStats, rosterStats] = await Promise.all([
    aggregateSessionStats(sessionIds),
    aggregateRosterStats(sessions.map((session) => session.section))
  ]);
  const metricsMap = buildMetricsMap(sessions, sessionStats.attendanceStats, sessionStats.incidentStats, rosterStats);

  return Promise.all(
    sessions.map((session) => serializeTeacherSession(session, metricsMap.get(String(session._id))))
  );
};

const ensureTeacherSession = async (publicSessionId, teacherId) => {
  const session = await AttendanceSession.findOne({
    publicSessionId,
    teacher: teacherId
  }).populate("teacher");

  if (!session) {
    throw new AppError("Attendance session not found for this teacher.", 404);
  }

  return session;
};

const ensureValidQr = (session, qrToken) => {
  if (!qrToken || session.qrToken !== qrToken) {
    throw new AppError("Invalid QR code token.", 400);
  }
};

export const createSessionFromConfig = async ({
  teacher,
  courseName,
  section = "",
  room = "",
  validityMinutes,
  classDurationMinutes = 60,
  teacherName = teacher?.name || "",
  sessionSource = "MANUAL",
  scheduleId = null,
  scheduledForDateKey = "",
  scheduleStartTime = "",
  startedAt = new Date()
}) => {
  const expiresAt = new Date(startedAt.getTime() + validityMinutes * 60 * 1000);

  const session = await AttendanceSession.create({
    publicSessionId: uuidv4(),
    qrToken: uuidv4(),
    teacher: teacher._id,
    schedule: scheduleId,
    courseName,
    section,
    teacherName,
    room,
    validityMinutes,
    classDurationMinutes,
    sessionSource,
    scheduledForDateKey,
    scheduleStartTime,
    startedAt,
    expiresAt
  });

  const hydratedSession = await AttendanceSession.findById(session._id).populate("teacher");
  return serializeTeacherSession(hydratedSession);
};

export const createTeacherSession = async (payload, teacher) => {
  const courseName = normalizeText(payload.courseName);

  if (!courseName) {
    throw new AppError("Course name is required.", 400);
  }

  const validityMinutes = Number(payload.validityMinutes || 2);

  if (!Number.isFinite(validityMinutes) || validityMinutes < 1 || validityMinutes > 30) {
    throw new AppError("Session validity must be between 1 and 30 minutes.", 400);
  }

  const classDurationMinutes = Number(payload.classDurationMinutes || 60);

  return createSessionFromConfig({
    teacher,
    courseName,
    section: normalizeText(payload.section || ""),
    room: normalizeText(payload.room || ""),
    validityMinutes,
    classDurationMinutes,
    teacherName: teacher.name,
    sessionSource: "MANUAL"
  });
};

export const listTeacherSessions = async (teacherId) => {
  const sessions = await AttendanceSession.find({ teacher: teacherId })
    .populate("teacher")
    .sort({ createdAt: -1 });

  return hydrateTeacherSessionsWithMetrics(sessions);
};

export const getTeacherSessionByPublicId = async (publicSessionId, teacherId) => {
  const session = await ensureTeacherSession(publicSessionId, teacherId);
  const [serializedSession] = await hydrateTeacherSessionsWithMetrics([session]);
  return serializedSession;
};

export const closeTeacherSession = async (publicSessionId, teacherId) => {
  const session = await ensureTeacherSession(publicSessionId, teacherId);

  if (!session.closedAt) {
    session.closedAt = new Date();
    await session.save();
  }

  const [serializedSession] = await hydrateTeacherSessionsWithMetrics([session]);
  return serializedSession;
};

export const deleteTeacherSession = async (publicSessionId, teacherId) => {
  const session = await ensureTeacherSession(publicSessionId, teacherId);

  await Promise.all([
    AttendanceRecord.deleteMany({ session: session._id }),
    AttendanceIncident.deleteMany({ session: session._id })
  ]);

  await session.deleteOne();
};

export const getPublicSessionByQr = async (publicSessionId, qrToken) => {
  const session = await AttendanceSession.findOne({ publicSessionId }).populate("teacher");

  if (!session) {
    throw new AppError("Attendance session not found.", 404);
  }

  ensureValidQr(session, qrToken);

  return {
    publicSessionId: session.publicSessionId,
    courseName: session.courseName,
    section: session.section,
    room: session.room,
    teacherName: session.teacher?.name || session.teacherName,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    status: session.toObject().status,
    closedAt: session.closedAt
  };
};
