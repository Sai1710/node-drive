import { Cloud } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <Cloud size={36} color="var(--primary)" />
          <span>Drive</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
