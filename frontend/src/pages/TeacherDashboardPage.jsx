import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { CreateSessionForm } from "../components/CreateSessionForm";
import { MetricCard } from "../components/MetricCard";
import { ScheduleManager } from "../components/ScheduleManager";
import { SessionQRCodeCard } from "../components/SessionQRCodeCard";
import { SessionsGrid } from "../components/SessionsGrid";

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeSessionId = useMemo(
    () => todaySessions.find((session) => session.status === "ACTIVE")?.publicSessionId || todaySessions[0]?.publicSessionId || sessions[0]?.publicSessionId || "",
    [todaySessions, sessions]
  );

  const pastSessions = useMemo(() => sessions.filter((session) => session.status !== "ACTIVE"), [sessions]);

  const loadSessionDetails = async (targetSessionId) => {
    if (!targetSessionId) {
      setSelectedSession(null);
      setAttendance([]);
      setAbsentStudents([]);
      setIncidents([]);
      setSessionStats(null);
      return;
    }

    const [sessionData, attendanceData, incidentsData] = await Promise.all([
      api.getTeacherSession(targetSessionId),
      api.getTeacherSessionAttendance(targetSessionId),
      api.getTeacherSessionIncidents(targetSessionId)
    ]);

    setSelectedSession(sessionData);
    setAttendance(attendanceData.attendance || []);
    setAbsentStudents(attendanceData.absentStudents || []);
    setSessionStats(attendanceData.stats || null);
    setIncidents(incidentsData.incidents || []);
  };

  const loadDashboard = async (preferredSessionId = activeSessionId) => {
    setIsLoading(true);
    setError("");

    try {
      const [summaryData, sessionsData, todaySessionsData, schedulesData] = await Promise.all([
        api.getTeacherDashboardSummary(),
        api.getTeacherSessions(),
        api.getTeacherTodaySessions(),
        api.getTeacherSchedules()
      ]);

      setSummary(summaryData);
      setSessions(sessionsData);
      setTodaySessions(todaySessionsData);
      setSchedules(schedulesData);

      const resolvedSessionId =
        preferredSessionId || todaySessionsData.find((session) => session.status === "ACTIVE")?.publicSessionId || sessionsData[0]?.publicSessionId;

      if (resolvedSessionId) {
        await loadSessionDetails(resolvedSessionId);

      } else {
        setSelectedSession(null);
        setAttendance([]);
        setAbsentStudents([]);
        setIncidents([]);
        setSessionStats(null);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateSession = async (payload) => {
    setIsSubmitting(true);
    setError("");

    try {
      const newSession = await api.createTeacherSession(payload);
      await loadDashboard(newSession.publicSessionId);
      navigate(`/teacher/sessions/${newSession.publicSessionId}`);
      return true;
    } catch (createError) {
      setError(createError.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSession = async (nextSessionId) => {
    if (!nextSessionId) {
      return;
    }
    navigate(`/teacher/sessions/${nextSessionId}`);
  };

  const handleCreateSchedule = async (payload) => {
    setIsSubmitting(true);
    setError("");

    try {
      await api.createTeacherSchedule(payload);
      await loadDashboard(selectedSession?.publicSessionId);
      return true;
    } catch (scheduleError) {
      setError(scheduleError.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (scheduleId, payload) => {
    setIsSubmitting(true);
    setError("");

    try {
      await api.updateTeacherSchedule(scheduleId, payload);
      await loadDashboard(selectedSession?.publicSessionId);
      return true;
    } catch (scheduleError) {
      setError(scheduleError.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.deleteTeacherSchedule(scheduleId);
      await loadDashboard(selectedSession?.publicSessionId);
    } catch (scheduleError) {
      setError(scheduleError.message);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) {
      return;
    }

    try {
      await api.closeTeacherSession(selectedSession.publicSessionId);
      await loadDashboard(selectedSession.publicSessionId);
    } catch (closeError) {
      setError(closeError.message);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="hero-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="eyebrow">Good Morning, Instructor</p>
          <h2>Platform Overview</h2>
          <p className="subtle-text">
            Manage your classes, active QR sessions, and view analytics.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={() => loadDashboard()}>
          Refresh Data
        </button>
      </header>

      {error && <div className="feedback error">{error}</div>}
      {isLoading && <div className="feedback">Loading teacher dashboard...</div>}

      <section className="metrics-grid">
        <MetricCard label="Total Sessions" value={summary?.totalSessions ?? 0} hint="Total manual & scheduled" />
        <MetricCard label="Active Sessions" value={summary?.activeSessions ?? 0} hint="Currently open for QR" />
        <MetricCard label="Attendance" value={summary?.totalAttendance ?? 0} hint="Successful check-ins" />
        <MetricCard label="Incidents" value={summary?.totalIncidents ?? 0} hint="Blocked proxy attempts" />
      </section>

      {selectedSession && (
        <section className="modern-panel" style={{ marginBottom: '24px' }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Session Report</p>
              <h2>{selectedSession.courseName}</h2>
            </div>
            <span className={`status-badge ${selectedSession.status === "ACTIVE" ? "ok" : ""}`}>
              {selectedSession.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontWeight: '600' }}>
            <span>Total Students: {sessionStats?.totalStudents ?? selectedSession.totalStudents ?? 0}</span>
            <span style={{ color: '#16A34A' }}>Present: {sessionStats?.presentCount ?? selectedSession.presentCount ?? 0}</span>
            <span style={{ color: '#DC2626' }}>Absent: {sessionStats?.absentCount ?? selectedSession.absentCount ?? 0}</span>
            <span style={{ color: '#D97706' }}>Suspicious: {sessionStats?.suspiciousCount ?? selectedSession.suspiciousCount ?? 0}</span>
          </div>

          <div className="header-actions" style={{ marginTop: '20px' }}>
            <Link className="secondary-button" to={`/teacher/sessions/${selectedSession.publicSessionId}`}>
              Open Full Session Page
            </Link>
          </div>
        </section>
      )}

      <section className="dashboard-grid">
        <CreateSessionForm onSubmit={handleCreateSession} isSubmitting={isSubmitting} />
        <SessionQRCodeCard
          session={selectedSession}
          attendanceCount={attendance.length}
          incidentCount={incidents.length}
          onClose={handleCloseSession}
        />
      </section>

      <ScheduleManager
        schedules={schedules}
        onCreate={handleCreateSchedule}
        onUpdate={handleUpdateSchedule}
        onDelete={handleDeleteSchedule}
        isSubmitting={isSubmitting}
      />

      <div className="dashboard-grid">
        <SessionsGrid
          sessions={todaySessions}
          selectedSessionId={activeSessionId}
          onSelect={handleSelectSession}
          eyebrow="Today's Sessions"
          title="Auto-Generated"
          emptyTitle="No Sessions Today"
          emptyMessage="Automatic sessions will appear here based on schedules."
        />
        <SessionsGrid
          sessions={pastSessions}
          selectedSessionId={activeSessionId}
          onSelect={handleSelectSession}
          eyebrow="Past Sessions"
          title="Session History"
          emptyTitle="No Past Sessions"
          emptyMessage="Closed sessions will appear here."
        />
      </div>
    </div>
  );
};
