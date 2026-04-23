import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    publicSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    qrToken: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSchedule",
      default: null,
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
    teacherName: {
      type: String,
      required: true,
      trim: true
    },
    room: {
      type: String,
      trim: true,
      default: ""
    },
    validityMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
      default: 2
    },
    classDurationMinutes: {
      type: Number,
      min: 1,
      default: 60
    },
    sessionSource: {
      type: String,
      enum: ["MANUAL", "AUTO"],
      default: "MANUAL"
    },
    scheduledForDateKey: {
      type: String,
      default: ""
    },
    scheduleStartTime: {
      type: String,
      default: ""
    },
    startedAt: {
      type: Date,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

attendanceSessionSchema.index(
  { schedule: 1, scheduledForDateKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      schedule: { $exists: true, $ne: null },
      scheduledForDateKey: { $exists: true, $gt: "" }
    }
  }
);

attendanceSessionSchema.virtual("status").get(function status() {
  if (this.closedAt) {
    return "CLOSED";
  }

  return new Date() > this.expiresAt ? "EXPIRED" : "ACTIVE";
});

attendanceSessionSchema.set("toJSON", { virtuals: true });
attendanceSessionSchema.set("toObject", { virtuals: true });

export const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);
