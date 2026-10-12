import { useState } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/drive";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <h1>Sign in</h1>
      <p className="muted">Continue to your Drive</p>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setError("");
          setSubmitting(true);
          try {
            await login(String(data.get("email")).trim(), String(data.get("password")));
            navigate(from, { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed.");
            setSubmitting(false);
          }
        }}
      >
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="auth-switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </>
  );
}
