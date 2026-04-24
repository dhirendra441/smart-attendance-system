const resolveApiBaseUrl = () => {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();

  if (configuredBaseUrl && configuredBaseUrl.toLowerCase() !== "auto") {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "http://localhost:5000/api/v1";
  }

  const currentHost = window.location.hostname || "localhost";
  return `http://${currentHost}:5000/api/v1`;
};

const API_BASE_URL = resolveApiBaseUrl();

const AUTH_STORAGE_KEY = "smart-attendance-auth";

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return "";
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed.token || "";
  } catch (error) {
    return "";
  }
};

const request = async (endpoint, options = {}) => {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Request failed.");
  }

  return result.data;
};

export const authStorage = {
  key: AUTH_STORAGE_KEY
};

export const api = {
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMe: () => request("/auth/me"),
  getTeacherDashboardSummary: () => request("/teacher/dashboard/summary"),
  getTeacherSessions: () => request("/teacher/sessions"),
  getTeacherTodaySessions: () => request("/teacher/sessions/today"),
  createTeacherSession: (payload) =>
    request("/teacher/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getTeacherSession: (sessionId) => request(`/teacher/sessions/${sessionId}`),
  deleteTeacherSession: (sessionId) =>
    request(`/teacher/sessions/${sessionId}`, {
      method: "DELETE"
    }),
  closeTeacherSession: (sessionId) =>
    request(`/teacher/sessions/${sessionId}/close`, {
      method: "PATCH"
    }),
  getTeacherSessionAttendance: (sessionId) => request(`/teacher/sessions/${sessionId}/attendance`),
  getTeacherSessionIncidents: (sessionId) => request(`/teacher/sessions/${sessionId}/incidents`),
  getTeacherSchedules: () => request("/teacher/schedules"),
  createTeacherSchedule: (payload) =>
    request("/teacher/schedules", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTeacherSchedule: (scheduleId, payload) =>
    request(`/teacher/schedules/${scheduleId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteTeacherSchedule: (scheduleId) =>
    request(`/teacher/schedules/${scheduleId}`, {
      method: "DELETE"
    }),
  getStudentDashboard: () => request("/student/dashboard"),
  verifyStudentAttendanceWindow: (sessionId, token) =>
    request(`/student/attendance/${sessionId}/verify?token=${encodeURIComponent(token)}`),
  markStudentAttendance: (sessionId, payload) =>
    request(`/student/attendance/${sessionId}/mark`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getPublicAttendanceSession: (sessionId, token) =>
    request(`/public/attendance/${sessionId}?token=${encodeURIComponent(token)}`)
};
