import mongoose from "mongoose";

const classScheduleSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      trim: true,
      default: ""
    },
    room: {
      type: String,
      trim: true,
      default: ""
    },
    days: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one day must be selected."
      }
    },
    startTime: {
      type: String,
      required: true
    },
    classDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 240,
      default: 60
    },
    qrValidityMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 2
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const ClassSchedule = mongoose.model("ClassSchedule", classScheduleSchema);
