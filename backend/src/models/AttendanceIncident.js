import mongoose from "mongoose";

const attendanceIncidentSchema = new mongoose.Schema(
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
      default: null
    },
    studentName: {
      type: String,
      default: ""
    },
    rollNumber: {
      type: String,
      default: ""
    },
    attemptType: {
      type: String,
      enum: ["PROXY_BLOCKED", "DUPLICATE", "EXPIRED", "SESSION_CLOSED", "INVALID_QR"],
      required: true
    },
    reason: {
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
        default: ""
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const AttendanceIncident = mongoose.model("AttendanceIncident", attendanceIncidentSchema);
