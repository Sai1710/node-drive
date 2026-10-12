import { mockUser } from "../data/mockFiles";
import { formatBytes } from "../utils";
import { useAuth } from "../auth/useAuth";

// Profile shows the signed-in email. Password, storage and delete stay UI-only
// because auth-service and file-service have no endpoints for them yet.
export default function SettingsPage() {
  const { user } = useAuth();
  const usedPct = Math.round((mockUser.storageUsed / mockUser.storageTotal) * 100);

  return (
    <section className="settings">
      <h1>Settings</h1>

      <div className="card">
        <h2>Profile</h2>
        <div className="settings-form">
          <label>
            Email
            <span className="readonly-value">{user?.email}</span>
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Change password</h2>
        <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
          <label>
            Current password
            <input type="password" autoComplete="current-password" />
          </label>
          <label>
            New password
            <input type="password" autoComplete="new-password" minLength={8} />
          </label>
          <button className="btn" type="submit">
            Update password
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Storage</h2>
        <div className="storage-bar large">
          <div style={{ width: `${usedPct}%` }} />
        </div>
        <p className="muted">
          {formatBytes(mockUser.storageUsed)} of {formatBytes(mockUser.storageTotal)} used ({usedPct}%)
        </p>
      </div>

      <div className="card danger">
        <h2>Delete account</h2>
        <p className="muted">This permanently removes your account and all files.</p>
        <button className="btn btn-danger">Delete account</button>
      </div>
    </section>
  );
}
