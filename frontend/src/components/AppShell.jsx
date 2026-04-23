import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export const AppShell = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const isAttendanceRoute = location.pathname.startsWith("/attendance/");
  const teacherActive = location.pathname.startsWith("/teacher");
  const studentActive = location.pathname.startsWith("/student");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* UPDATED HEADER: Now matches the transparent, blurry dark mode 
        aesthetic of AI startup sites instead of the old white background.
      */}
      <header style={{ 
        background: 'rgba(10, 10, 10, 0.6)', 
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>College Project</p>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#FFF', letterSpacing: '-0.5px' }}>
            Smart Attendance
          </h1>
        </div>

        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {!isAuthenticated && (
            <Link className={location.pathname === "/login" ? "secondary-button active" : "ghost-button"} to="/login">
              Login
            </Link>
          )}
          {isAuthenticated && user?.role === "teacher" && (
            <Link className={teacherActive ? "secondary-button" : "ghost-button"} to="/teacher" style={{ textDecoration: 'none' }}>
              Teacher Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === "student" && (
            <Link className={studentActive ? "secondary-button" : "ghost-button"} to="/student" style={{ textDecoration: 'none' }}>
              My Attendance
            </Link>
          )}
          {isAttendanceRoute && (
            <span className="secondary-button" aria-current="page">
              QR Attendance
            </span>
          )}
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', paddingLeft: '16px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#E4E4E7' }}>{user.name}</span>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="page-layout" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};