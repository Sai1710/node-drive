import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <h1>Create account</h1>
      <p className="muted">Get started with your Drive</p>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const password = String(data.get("password"));
          if (password !== data.get("confirm")) {
            setError("Passwords do not match.");
            return;
          }
          setError("");
          setSubmitting(true);
          try {
            // Registers, then signs in with the same credentials.
            await signup(String(data.get("email")).trim(), password);
            navigate("/drive", { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign up failed.");
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
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Confirm password
          <input type="password" name="confirm" required minLength={8} autoComplete="new-password" />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
