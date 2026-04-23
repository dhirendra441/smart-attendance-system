import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DemoCredentialsCard } from "../components/DemoCredentialsCard";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, login } = useAuth();
  const [formState, setFormState] = useState({
    phoneNumber: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => searchParams.get("redirect") || "", [searchParams]);

  if (isAuthenticated) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const loggedInUser = await login(formState);
      const fallbackRoute = loggedInUser.role === "teacher" ? "/teacher" : "/student";
      const nextRoute =
        redirectTarget && (loggedInUser.role === "student" || !redirectTarget.startsWith("/attendance/"))
          ? redirectTarget
          : fallbackRoute;
      navigate(nextRoute, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <section className="login-card">
        <div className="hero-header">
          <p className="eyebrow">Secure Access</p>
          <h2>Welcome back</h2>
          <p className="subtle-text">Login to the Attendance Portal to continue</p>
        </div>

        {error && <div className="feedback error">{error}</div>}

        <form className="session-form" onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          <label>
            Phone Number or Roll Number
            <input
              name="phoneNumber"
              value={formState.phoneNumber}
              onChange={handleChange}
              placeholder="9000000001 or 23CSE101"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <DemoCredentialsCard />
      </section>
    </div>
  );
};