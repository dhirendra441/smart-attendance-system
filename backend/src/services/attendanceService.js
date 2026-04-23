import { AttendanceIncident } from "../models/AttendanceIncident.js";
import { AttendanceRecord } from "../models/AttendanceRecord.js";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { buildDeviceContext } from "../utils/device.js";
import { normalizeIdentity } from "../utils/normalize.js";

const startOfCurrentMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const createIncident = async ({ session, student, device, attemptType, reason }) =>
  AttendanceIncident.create({
    session: session._id,
    student: student?._id || null,
    studentName: student?.name || "",
    rollNumber: student?.rollNumber || "",
    attemptType,
    reason,
    device
  });

const buildStudentIdentity = (student) => ({
  studentName: student.name,
  rollNumber: student.rollNumber || "",
  studentIdentifier: normalizeIdentity(student.rollNumber || student.phoneNumber || student.name)
});

const getSessionOrThrow = async (publicSessionId) => {
  const session = await AttendanceSession.findOne({ publicSessionId }).populate("teacher");

  if (!session) {
    throw new AppError("Attendance session not found.", 404);
  }

  return session;
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

const ensureQrToken = async (session, qrToken, student, device) => {
  if (session.qrToken === qrToken) {
    return;
  }

  await createIncident({
    session,
    student,
    device,
    attemptType: "INVALID_QR",
    reason: "The QR token did not match the active classroom session."
  });

  throw new AppError("Invalid QR code for this session.", 400);
};

const ensureActiveSession = async (session, student, device) => {
  if (session.closedAt) {
    await createIncident({
      session,
      student,
      device,
      attemptType: "SESSION_CLOSED",
      reason: "Attendance was attempted after the teacher had already closed the session."
    });

    throw new AppError("This attendance session has already been closed by the teacher.", 400);
  }

  if (new Date() > session.expiresAt) {
    await createIncident({
      session,
      student,
      device,
      attemptType: "EXPIRED",
      reason: "Attendance was attempted after the session expiry time."
    });

    throw new AppError("This attendance session has expired.", 400);
  }
};

export const verifyAttendanceWindow = async (publicSessionId, qrToken, student) => {
  const session = await getSessionOrThrow(publicSessionId);

  if (session.qrToken !== qrToken) {
    throw new AppError("Invalid QR code for this session.", 400);
  }

  const existingAttendance = student
    ? await AttendanceRecord.findOne({
        session: session._id,
        student: student._id
      })
    : null;

  return {
    publicSessionId: session.publicSessionId,
    courseName: session.courseName,
    section: session.section,
    room: session.room,
    teacherName: session.teacher?.name || session.teacherName,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    status: session.toObject().status,
    alreadyMarked: Boolean(existingAttendance)
  };
};

export const markStudentAttendance = async (publicSessionId, payload, requestContext, student) => {
  const session = await getSessionOrThrow(publicSessionId);
  const device = buildDeviceContext({
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    clientMeta: payload.clientMeta || {}
  });

  await ensureQrToken(session, payload.qrToken, student, device);
  await ensureActiveSession(session, student, device);

  const existingRecord = await AttendanceRecord.findOne({
    session: session._id,
    student: student._id
  });

  if (existingRecord) {
    await createIncident({
      session,
      student,
      device,
      attemptType: "DUPLICATE",
      reason: "The student tried to submit attendance more than once for the same session."
    });

    throw new AppError("Attendance has already been marked for this student.", 409);
  }

  const conflictingRecord = await AttendanceRecord.findOne({
    session: session._id,
    "device.browserSignature": device.browserSignature,
    student: { $ne: student._id }
  });

  if (conflictingRecord) {
    await createIncident({
      session,
      student,
      device,
      attemptType: "PROXY_BLOCKED",
      reason: "This device has already been used by another student in the same session."
    });

    throw new AppError(
      "Proxy attempt blocked. This device has already been used to mark attendance for another student in this session.",
      403
    );
  }

  const studentIdentity = buildStudentIdentity(student);

  const record = await AttendanceRecord.create({
    session: session._id,
    student: student._id,
    studentName: studentIdentity.studentName,
    rollNumber: studentIdentity.rollNumber,
    studentIdentifier: studentIdentity.studentIdentifier,
    device,
    suspicious: false,
    suspiciousReason: "",
    submittedAt: new Date()
  });

  return {
    ...record.toObject(),
    session: {
      publicSessionId: session.publicSessionId,
      courseName: session.courseName,
      section: session.section
    }
  };
};

export const getTeacherSessionAttendance = async (publicSessionId, teacherId) => {
  const session = await ensureTeacherSession(publicSessionId, teacherId);

  const [records, incidents, classStudents] = await Promise.all([
    AttendanceRecord.find({ session: session._id })
      .populate("student", "name phoneNumber rollNumber department section")
      .sort({
        submittedAt: 1
      }),
    AttendanceIncident.find({ session: session._id }).sort({ createdAt: -1 }),
    session.section
      ? User.find({
          role: "student",
          section: session.section
        })
          .select("name rollNumber section department")
          .sort({ name: 1, rollNumber: 1 })
      : Promise.resolve([])
  ]);

  const incidentByStudent = new Map();

  incidents.forEach((incident) => {
    if (!incident.student) {
      return;
    }

    const studentKey = String(incident.student);

    if (!incidentByStudent.has(studentKey)) {
      incidentByStudent.set(studentKey, incident);
    }
  });

  const presentStudentIds = new Set(
    records.map((record) => String(record.student?._id || record.student)).filter(Boolean)
  );

  const absentStudents = classStudents
    .filter((student) => !presentStudentIds.has(String(student._id)))
    .map((student) => ({
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber || "",
      section: student.section || session.section || "",
      department: student.department || ""
    }));

  const attendanceRecords = records.map((record) => {
    const incident = incidentByStudent.get(String(record.student?._id || record.student));

    return {
      ...record.toObject(),
      suspicious: Boolean(incident),
      suspiciousReason: incident?.reason || "",
      suspiciousType: incident?.attemptType || ""
    };
  });

  return {
    session,
    records: attendanceRecords,
    absentStudents,
    stats: {
      totalStudents: classStudents.length,
      presentCount: attendanceRecords.length,
      absentCount: absentStudents.length,
      suspiciousCount: incidents.length
    }
  };
};

export const getTeacherSessionIncidents = async (publicSessionId, teacherId) => {
  const session = await ensureTeacherSession(publicSessionId, teacherId);

  const incidents = await AttendanceIncident.find({ session: session._id })
    .populate("student", "name phoneNumber rollNumber")
    .sort({
      createdAt: -1
    });

  return {
    session,
    incidents
  };
};

export const getTeacherDashboardSummary = async (teacherId) => {
  const teacherSessions = await AttendanceSession.find({ teacher: teacherId }).select("_id expiresAt closedAt");
  const sessionIds = teacherSessions.map((session) => session._id);

  if (!sessionIds.length) {
    return {
      totalSessions: 0,
      activeSessions: 0,
      totalAttendance: 0,
      totalIncidents: 0
    };
  }

  const now = new Date();
  const [totalAttendance, totalIncidents] = await Promise.all([
    AttendanceRecord.countDocuments({ session: { $in: sessionIds } }),
    AttendanceIncident.countDocuments({ session: { $in: sessionIds } })
  ]);

  const activeSessions = teacherSessions.filter((session) => !session.closedAt && session.expiresAt > now).length;

  return {
    totalSessions: teacherSessions.length,
    activeSessions,
    totalAttendance,
    totalIncidents
  };
};

export const getStudentDashboard = async (studentId) => {
  const [records, incidents] = await Promise.all([
    AttendanceRecord.find({ student: studentId })
      .populate({
        path: "session",
        select: "publicSessionId courseName section room startedAt expiresAt teacherName",
        options: { sort: { startedAt: -1 } }
      })
      .sort({ submittedAt: -1 }),
    AttendanceIncident.find({ student: studentId }).populate({
      path: "session",
      select: "publicSessionId courseName section room startedAt expiresAt teacherName"
    })
  ]);

  const summary = {
    totalMarkedSessions: records.length,
    uniqueCourses: new Set(records.map((record) => record.session?.courseName).filter(Boolean)).size,
    thisMonthAttendance: records.filter((record) => record.submittedAt >= startOfCurrentMonth()).length,
    blockedAttempts: incidents.length
  };

  const courseMap = new Map();

  records.forEach((record) => {
    const courseName = record.session?.courseName || "Unknown Course";
    const current = courseMap.get(courseName) || { courseName, count: 0 };
    current.count += 1;
    courseMap.set(courseName, current);
  });

  return {
    summary,
    courseAnalytics: Array.from(courseMap.values()).sort((a, b) => b.count - a.count),
    attendanceHistory: records.map((record) => ({
      id: record._id,
      submittedAt: record.submittedAt,
      session: record.session
    })),
    incidentHistory: incidents.map((incident) => ({
      id: incident._id,
      attemptType: incident.attemptType,
      reason: incident.reason,
      createdAt: incident.createdAt,
      session: incident.session
    }))
  };
};
