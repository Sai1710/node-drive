import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Clock,
  Cloud,
  HardDrive,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import UploadModal from "../components/UploadModal";
import { mockUser } from "../data/mockFiles";
import { useAuth } from "../auth/useAuth";
import { useFileList } from "../files/useFileList";
import type { DriveContext } from "../files/driveContext";
import { formatBytes } from "../utils";

const nav = [
  { to: "/drive", label: "My Drive", Icon: HardDrive },
  { to: "/shared", label: "Shared with me", Icon: Users },
  { to: "/recent", label: "Recent", Icon: Clock },
  { to: "/starred", label: "Starred", Icon: Star },
  { to: "/trash", label: "Trash", Icon: Trash2 },
];

export default function DriveLayout() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Fetched once the drive opens after sign-in, then after each upload.
  const fileList = useFileList();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const email = user?.email ?? "";
  // Storage numbers stay mocked: file-service has no usage endpoint yet.
  const usedPct = Math.round((mockUser.storageUsed / mockUser.storageTotal) * 100);
  const initials = (email[0] ?? "?").toUpperCase();

  return (
    <div className="drive-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}>
        <Link to="/drive" className="brand">
          <Cloud size={28} color="var(--primary)" />
          <span>Drive</span>
        </Link>

        <button
          className="new-btn"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
            setUploadOpen(true);
          }}
        >
          <Plus size={20} /> New
        </button>

        <nav className="side-nav">
          {nav.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="storage">
          <div className="storage-bar">
            <div style={{ width: `${usedPct}%` }} />
          </div>
          <p className="muted">
            {formatBytes(mockUser.storageUsed)} of {formatBytes(mockUser.storageTotal)} used
          </p>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <form
            className="search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString().trim();
              if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search size={18} />
            <input name="q" placeholder="Search in Drive" aria-label="Search in Drive" />
          </form>

          <div className="topbar-right">
            <Link to="/settings" className="icon-btn" aria-label="Settings">
              <Settings size={20} />
            </Link>
            <div className="avatar-wrap">
              <button className="avatar" onClick={() => setMenuOpen((o) => !o)} aria-label="Account menu">
                {initials}
              </button>
              {menuOpen && (
                <div className="account-menu" onMouseLeave={() => setMenuOpen(false)}>
                  <div className="account-info">
                    <strong className="truncate">{email || "Signed in"}</strong>
                  </div>
                  <Link to="/settings" onClick={() => setMenuOpen(false)}>
                    <Settings size={16} /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void logout(); // route guard redirects to /login once cleared
                    }}
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet context={{ openUpload: () => setUploadOpen(true), fileList } satisfies DriveContext} />
        </main>
      </div>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onUploaded={fileList.reload} />}
    </div>
  );
}
