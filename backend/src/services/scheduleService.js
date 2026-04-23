import cron from "node-cron";
import { AttendanceSession } from "../models/AttendanceSession.js";
import { ClassSchedule } from "../models/ClassSchedule.js";
import { AppError } from "../utils/AppError.js";
import { normalizeText } from "../utils/normalize.js";
import { createSessionFromConfig, hydrateTeacherSessionsWithMetrics } from "./sessionService.js";

const VALID_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun"
};

const formatDateKey = (date) => date.toISOString().slice(0, 10);
const formatTime = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
const dayValueFromDate = (date) => VALID_DAYS[(date.getDay() + 6) % 7];

const normalizeDays = (days = []) => {
  if (!Array.isArray(days) || !days.length) {
    throw new AppError("Select at least one schedule day.", 400);
  }

  const normalizedDays = [...new Set(days.map((day) => normalizeText(day).toUpperCase()))];

  if (normalizedDays.some((day) => !VALID_DAYS.includes(day))) {
    throw new AppError("Invalid day selection.", 400);
  }

  return normalizedDays.sort((left, right) => VALID_DAYS.indexOf(left) - VALID_DAYS.indexOf(right));
};

const normalizeStartTime = (value = "") => {
  const normalizedValue = normalizeText(value);

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(normalizedValue)) {
    throw new AppError("Start time must use HH:MM 24-hour format.", 400);
  }

  return normalizedValue;
};

const serializeSchedule = (schedule) => ({
  ...schedule.toObject(),
  teacher: schedule.teacher
    ? {
        id: schedule.teacher._id,
        name: schedule.teacher.name,
        phoneNumber: schedule.teacher.phoneNumber
      }
    : undefined,
  dayLabels: schedule.days.map((day) => DAY_LABELS[day] || day)
});

const buildSchedulePayload = (payload) => {
  const courseName = normalizeText(payload.courseName);

  if (!courseName) {
    throw new AppError("Course name is required.", 400);
  }

  const classDurationMinutes = Number(payload.classDurationMinutes || 60);
  const qrValidityMinutes = Number(payload.qrValidityMinutes || 2);

  if (!Number.isFinite(classDurationMinutes) || classDurationMinutes < 1 || classDurationMinutes > 240) {
    throw new AppError("Class duration must be between 1 and 240 minutes.", 400);
  }

  if (!Number.isFinite(qrValidityMinutes) || qrValidityMinutes < 1 || qrValidityMinutes > 10) {
    throw new AppError("QR validity must be between 1 and 10 minutes.", 400);
  }

  return {
    courseName,
    section: normalizeText(payload.section || ""),
    room: normalizeText(payload.room || ""),
    days: normalizeDays(payload.days || []),
    startTime: normalizeStartTime(payload.startTime),
    classDurationMinutes,
    qrValidityMinutes,
    isActive: payload.isActive ?? true
  };
};

const findTeacherSchedule = async (scheduleId, teacherId) => {
  const schedule = await ClassSchedule.findOne({
    _id: scheduleId,
    teacher: teacherId
  }).populate("teacher");

  if (!schedule) {
    throw new AppError("Schedule not found for this teacher.", 404);
  }

  return schedule;
};

export const createTeacherSchedule = async (payload, teacher) => {
  const schedule = await ClassSchedule.create({
    teacher: teacher._id,
    ...buildSchedulePayload(payload)
  });

  const hydratedSchedule = await ClassSchedule.findById(schedule._id).populate("teacher");
  return serializeSchedule(hydratedSchedule);
};

export const listTeacherSchedules = async (teacherId) => {
  const schedules = await ClassSchedule.find({ teacher: teacherId })
    .populate("teacher")
    .sort({ startTime: 1, createdAt: -1 });

  return schedules.map(serializeSchedule);
};

export const updateTeacherSchedule = async (scheduleId, payload, teacherId) => {
  const schedule = await findTeacherSchedule(scheduleId, teacherId);
  const nextPayload = buildSchedulePayload({
    ...schedule.toObject(),
    ...payload
  });

  Object.assign(schedule, nextPayload);
  await schedule.save();

  return serializeSchedule(schedule);
};

export const deleteTeacherSchedule = async (scheduleId, teacherId) => {
  const schedule = await findTeacherSchedule(scheduleId, teacherId);
  await schedule.deleteOne();
};

export const getTeacherTodaySessions = async (teacherId) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const sessions = await AttendanceSession.find({
    teacher: teacherId,
    startedAt: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  })
    .populate("teacher")
    .sort({ startedAt: 1 });

  return hydrateTeacherSessionsWithMetrics(sessions);
};

export const triggerDueSchedules = async (currentTime = new Date()) => {
  const currentDay = dayValueFromDate(currentTime);
  const currentStartTime = formatTime(currentTime);
  const currentDateKey = formatDateKey(currentTime);

  const dueSchedules = await ClassSchedule.find({
    isActive: true,
    days: currentDay,
    startTime: currentStartTime
  }).populate("teacher");

  const createdSessions = [];

  for (const schedule of dueSchedules) {
    const existingSession = await AttendanceSession.findOne({
      schedule: schedule._id,
      scheduledForDateKey: currentDateKey
    });

    if (existingSession) {
      continue;
    }

    const createdSession = await createSessionFromConfig({
      teacher: schedule.teacher,
      courseName: schedule.courseName,
      section: schedule.section,
      room: schedule.room,
      validityMinutes: schedule.qrValidityMinutes,
      classDurationMinutes: schedule.classDurationMinutes,
      teacherName: schedule.teacher.name,
      sessionSource: "AUTO",
      scheduleId: schedule._id,
      scheduledForDateKey: currentDateKey,
      scheduleStartTime: schedule.startTime,
      startedAt: currentTime
    });

    createdSessions.push(createdSession);
  }

  return createdSessions;
};

let schedulerTask = null;
let isScheduleRunActive = false;

export const startScheduleAutomation = () => {
  if (schedulerTask) {
    return schedulerTask;
  }

  schedulerTask = cron.schedule("* * * * *", async () => {
    if (isScheduleRunActive) {
      return;
    }

    isScheduleRunActive = true;

    try {
      const createdSessions = await triggerDueSchedules(new Date());

      if (createdSessions.length) {
        console.log(`Auto-created ${createdSessions.length} scheduled session(s).`);
      }
    } catch (error) {
      console.error("Scheduled session generation failed.", error);
    } finally {
      isScheduleRunActive = false;
    }
  });

  return schedulerTask;
};
