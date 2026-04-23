import {
  createTeacherSchedule,
  deleteTeacherSchedule,
  listTeacherSchedules,
  updateTeacherSchedule
} from "../services/scheduleService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTeacherScheduleController = asyncHandler(async (req, res) => {
  const schedule = await createTeacherSchedule(req.body, req.user);

  res.status(201).json({
    success: true,
    data: schedule
  });
});

export const listTeacherSchedulesController = asyncHandler(async (req, res) => {
  const schedules = await listTeacherSchedules(req.user._id);

  res.json({
    success: true,
    data: schedules
  });
});

export const updateTeacherScheduleController = asyncHandler(async (req, res) => {
  const schedule = await updateTeacherSchedule(req.params.scheduleId, req.body, req.user._id);

  res.json({
    success: true,
    data: schedule
  });
});

export const deleteTeacherScheduleController = asyncHandler(async (req, res) => {
  await deleteTeacherSchedule(req.params.scheduleId, req.user._id);
  res.status(204).send();
});
