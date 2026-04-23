import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { AbsentStudentsTable } from "../components/AbsentStudentsTable";
import { AttendanceTable } from "../components/AttendanceTable";
import { IncidentTable } from "../components/IncidentTable";
import { SessionQRCodeCard } from "../components/SessionQRCodeCard";

export const TeacherSessionDetailsPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSession = async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [sessionData, attendanceData, incidentsData] = await Promise.all([
        api.getTeacherSession(sessionId),
        api.getTeacherSessionAttendance(sessionId),
        api.getTeacherSessionIncidents(sessionId)
      ]);

      setSession(sessionData);
      setAttendance(attendanceData.attendance || []);
      setAbsentStudents(attendanceData.absentStudents || []);
      setIncidents(incidentsData.incidents || []);
      setStats(attendanceData.stats || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const handleCloseSession = async () => {
    if (!session) {
      return;
    }

    try {
      await api.closeTeacherSession(session.publicSessionId);
      await loadSession();
    } catch (closeError) {
      setError(closeError.message);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="hero-header session-detail-header">
        <div>
          <p className="eyebrow">Session Details</p>
          <h2>{session?.courseName || "Attendance Session"}</h2>
          <p className="subtle-text">
            View the QR, attendance report, absentees, and suspicious attempts for one class session.
          </p>
        </div>

        <div className="header-actions">
          <Link className="ghost-button" to="/teacher">
            Back to Dashboard
          </Link>
          <button type="button" className="secondary-button" onClick={loadSession}>
            Refresh Session
          </button>
        </div>
      </header>

      {error && <div className="feedback error">{error}</div>}
      {isLoading && <div className="feedback">Loading session details...</div>}

      {session && (
        <>
          <section className="modern-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Overview</p>
                <h2>{session.courseName}</h2>
              </div>
              <span className={`status-badge ${session.status === "ACTIVE" ? "ok" : "neutral"}`}>
                {session.status}
              </span>
            </div>

            <div className="session-report-grid">
              <span>Total Students: {stats?.totalStudents ?? session.totalStudents ?? 0}</span>
              <span>Present: {stats?.presentCount ?? session.presentCount ?? 0}</span>
              <span>Absent: {stats?.absentCount ?? session.absentCount ?? 0}</span>
              <span>Suspicious: {stats?.suspiciousCount ?? session.suspiciousCount ?? 0}</span>
            </div>
          </section>

          <SessionQRCodeCard
            session={session}
            attendanceCount={attendance.length}
            incidentCount={incidents.length}
            onClose={handleCloseSession}
          />

          <AttendanceTable attendance={attendance} />
          <AbsentStudentsTable absentStudents={absentStudents} />
          <IncidentTable incidents={incidents} />
        </>
      )}

      {!isLoading && !session && !error && (
        <section className="modern-panel">
          <p className="subtle-text">This session could not be found.</p>
          <button type="button" className="secondary-button" onClick={() => navigate("/teacher")}>
            Return to Dashboard
          </button>
        </section>
      )}
    </div>
  );
};
