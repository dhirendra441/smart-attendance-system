import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { StudentAttendancePage } from "./pages/StudentAttendancePage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { TeacherSessionDetailsPage } from "./pages/TeacherSessionDetailsPage";

const HomeRedirect = () => {
  const { isAuthenticated, isReady, user } = useAuth();

  if (!isReady) {
    return <div className="feedback">Preparing application...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
};

const App = () => (
  <AuthProvider>
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/sessions/:sessionId"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherSessionDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/attendance/:sessionId" element={<StudentAttendancePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  </AuthProvider>
);

export default App;
