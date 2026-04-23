import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentName: {
      type: String,
      trim: true,
      default: ""
    },
    rollNumber: {
      type: String,
      trim: true,
      default: ""
    },
    studentIdentifier: {
      type: String,
      required: true
    },
    device: {
      ipAddress: {
        type: String,
        default: ""
      },
      userAgent: {
        type: String,
        default: ""
      },
      browserSignature: {
        type: String,
        required: true
      },
      clientMeta: {
        platform: {
          type: String,
          default: ""
        },
        timezone: {
          type: String,
          default: ""
        },
        language: {
          type: String,
          default: ""
        },
        screen: {
          type: String,
          default: ""
        }
      }
    },
    suspicious: {
      type: Boolean,
      default: false
    },
    suspiciousReason: {
      type: String,
      default: ""
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

attendanceRecordSchema.index({ session: 1, studentIdentifier: 1 }, { unique: true });
attendanceRecordSchema.index({ session: 1, "device.browserSignature": 1 });
attendanceRecordSchema.index({ student: 1, submittedAt: -1 });

export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
