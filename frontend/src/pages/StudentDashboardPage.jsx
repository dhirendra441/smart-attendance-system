import { useEffect, useState } from "react";
import { api } from "../api/client";
import { CourseAnalyticsCard } from "../components/CourseAnalyticsCard";
import { IncidentTable } from "../components/IncidentTable";
import { MetricCard } from "../components/MetricCard";
import { StudentHistoryTable } from "../components/StudentHistoryTable";

export const StudentDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await api.getStudentDashboard();
        setDashboard(result);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="student-dashboard-page">
      <header className="hero-header">
        <p className="eyebrow">Student Workspace</p>
        <h2>My Attendance Overview</h2>
        <p className="subtle-text">
          Review your marked sessions, course history, and blocked attempts.
        </p>
      </header>

      {error && <div className="feedback error">{error}</div>}
      {isLoading && <div className="feedback">Loading your analytics...</div>}

      <section className="metrics-grid">
        <MetricCard
          label="Marked Sessions"
          value={dashboard?.summary?.totalMarkedSessions ?? 0}
          hint="Total attendance recorded"
        />
        <MetricCard
          label="Courses Covered"
          value={dashboard?.summary?.uniqueCourses ?? 0}
          hint="Unique enrolled courses"
        />
        <MetricCard
          label="This Month"
          value={dashboard?.summary?.thisMonthAttendance ?? 0}
          hint="Marked in current month"
        />
        <MetricCard
          label="Blocked Attempts"
          value={dashboard?.summary?.blockedAttempts ?? 0}
          hint="Duplicate or expired tries"
        />
      </section>

      <section className="dashboard-grid">
        <CourseAnalyticsCard analytics={dashboard?.courseAnalytics || []} />
        <IncidentTable incidents={dashboard?.incidentHistory || []} title="My Blocked Attempts" />
      </section>

      <StudentHistoryTable records={dashboard?.attendanceHistory || []} />
    </div>
  );
};
