import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const getClientMeta = () => ({
  platform: navigator.platform || "unknown",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
  language: navigator.language || "unknown",
  screen: `${window.screen.width}x${window.screen.height}`
});

export const StudentAttendancePage = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isReady, user, login, logout } = useAuth();
  const [publicSession, setPublicSession] = useState(null);
  const [verifiedSession, setVerifiedSession] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [authForm, setAuthForm] = useState({
    phoneNumber: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const autoSubmitRef = useRef(false);

  const qrToken = searchParams.get("token") || "";

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      setError("");

      try {
        const sessionData = await api.getPublicAttendanceSession(sessionId, qrToken);
        setPublicSession(sessionData);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (qrToken) {
      loadSession();
    } else {
      setIsLoading(false);
      setError("QR token is missing from the attendance link.");
    }
  }, [sessionId, qrToken]);

  useEffect(() => {
    const verifyWindow = async () => {
      if (!isAuthenticated || user?.role !== "student" || !qrToken) {
        setVerifiedSession(null);
        autoSubmitRef.current = false;
        return;
      }

      try {
        const data = await api.verifyStudentAttendanceWindow(sessionId, qrToken);
        setVerifiedSession(data);
      } catch (verifyError) {
        setError(verifyError.message);
      }
    };

    if (isReady) {
      verifyWindow();
    }
  }, [isAuthenticated, isReady, qrToken, sessionId, user]);

  const effectiveSession = verifiedSession || publicSession;
  const isExpired = useMemo(() => {
    if (!effectiveSession?.expiresAt) {
      return false;
    }

    return new Date(effectiveSession.expiresAt) < new Date() || effectiveSession.status === "CLOSED";
  }, [effectiveSession]);

  const submitAttendance = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.markStudentAttendance(sessionId, {
        qrToken,
        clientMeta: getClientMeta()
      });
      setResult(response);
      const refreshed = await api.verifyStudentAttendanceWindow(sessionId, qrToken);
      setVerifiedSession(refreshed);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const shouldAutoSubmit =
      isReady &&
      isAuthenticated &&
      user?.role === "student" &&
      verifiedSession &&
      !verifiedSession.alreadyMarked &&
      !isExpired &&
      !result &&
      !isSubmitting &&
      !isSigningIn &&
      !autoSubmitRef.current;

    if (!shouldAutoSubmit) {
      return;
    }

    autoSubmitRef.current = true;
    submitAttendance();
  }, [isAuthenticated, isExpired, isReady, isSigningIn, isSubmitting, result, user, verifiedSession]);

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleStudentLogin = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError("");

    try {
      const loggedInUser = await login(authForm);

      if (loggedInUser.role !== "student") {
        logout();
        throw new Error("Only registered student accounts can use the QR attendance page.");
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleUseAnotherStudent = () => {
    autoSubmitRef.current = false;
    setResult(null);
    setVerifiedSession(null);
    setAuthForm({
      phoneNumber: "",
      password: ""
    });
    logout();
  };

  return (
    <div className="login-wrapper">
      <section className="login-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">QR Check-In</p>
            <h2>{effectiveSession?.courseName || "Attendance Session"}</h2>
          </div>
          <Link
            className="secondary-button"
            to={!isAuthenticated ? "/" : user?.role === "teacher" ? "/teacher" : "/student"}
          >
            Dashboard
          </Link>
        </div>

        {error && <div className="feedback error">{error}</div>}
        {isLoading && <div className="feedback">Loading QR session...</div>}

        {effectiveSession && (
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
            <p><strong>Course:</strong> {effectiveSession.courseName}</p>
            <p><strong>Teacher:</strong> {effectiveSession.teacherName}</p>
            <p><strong>Room:</strong> {effectiveSession.room || "Not provided"}</p>
            <p><strong>Status:</strong> <span className={`status-badge ${isExpired ? "danger" : "ok"}`}>{effectiveSession.status}</span></p>
          </div>
        )}

        {!isAuthenticated && !isLoading && (
          <form className="session-form" onSubmit={handleStudentLogin}>
            <p className="subtle-text" style={{ marginBottom: '16px' }}>
              Enter your registered roll number and password to mark attendance.
            </p>

            <label>
              Roll Number
              <input
                name="phoneNumber"
                value={authForm.phoneNumber}
                onChange={handleAuthChange}
                placeholder="23CSE101"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder="student123"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSigningIn || isExpired}>
              {isSigningIn ? "Verifying..." : "Verify and Mark Attendance"}
            </button>
          </form>
        )}

        {isAuthenticated && user?.role === "teacher" && (
          <div className="feedback error">Teachers can open the QR page, but only students can mark attendance.</div>
        )}

        {isAuthenticated && user?.role === "student" && (
          <div className="session-form">
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <p><strong>Student:</strong> {user.name}</p>
              <p><strong>Roll Number:</strong> {user.rollNumber || "Not provided"}</p>
            </div>

            <button
              type="button"
              className="primary-button"
              disabled={isExpired || isSubmitting || verifiedSession?.alreadyMarked}
              onClick={submitAttendance}
            >
              {verifiedSession?.alreadyMarked
                ? "Attendance Already Marked"
                : isSubmitting
                  ? "Submitting..."
                  : result
                    ? "Attendance Recorded"
                    : "Mark My Attendance"}
            </button>

            <button type="button" className="ghost-button" onClick={handleUseAnotherStudent}>
              Use Another Student Account
            </button>
          </div>
        )}

        {result && (
          <div className="feedback success" style={{ marginTop: '16px' }}>
            Attendance recorded successfully at {formatDateTime(result.submittedAt)}.
          </div>
        )}
      </section>
    </div>
  );
};