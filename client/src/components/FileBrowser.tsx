import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List, MoreVertical, Star } from "lucide-react";
import type { DriveFile, ViewMode } from "../types";
import { formatBytes, formatDate } from "../utils";
import FileIcon from "./FileIcon";
import EmptyState, { type EmptyStateProps } from "./EmptyState";

interface Props {
  title: string;
  files: DriveFile[];
  empty: EmptyStateProps;
  actions?: ReactNode;
  banner?: ReactNode;
  showOwner?: boolean;
  dateLabel?: string;
}

export default function FileBrowser({
  title,
  files,
  empty,
  actions,
  banner,
  showOwner,
  dateLabel = "Last modified",
}: Props) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <section className="browser">
      <header className="browser-header">
        <h1>{title}</h1>
        <div className="browser-actions">
          {actions}
          <div className="view-toggle" role="group" aria-label="View mode">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view">
              <List size={18} />
            </button>
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view">
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </header>

      {banner}

      {files.length === 0 ? (
        <EmptyState {...empty} />
      ) : view === "list" ? (
        <div className="table-wrap">
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                {showOwner && <th>Owner</th>}
                <th className="hide-sm">{dateLabel}</th>
                <th className="hide-sm">File size</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f._id}>
                  <td>
                    <Link to={`/file/${f._id}`} className="file-name">
                      <FileIcon mime={f.mime_type} />
                      <span className="truncate">{f.file_name}</span>
                      {f.is_starred && <Star size={14} className="star" fill="currentColor" />}
                    </Link>
                  </td>
                  {showOwner && <td className="muted">{f.owner}</td>}
                  <td className="muted hide-sm">{formatDate(f.updatedAt)}</td>
                  <td className="muted hide-sm">{formatBytes(f.size)}</td>
                  <td className="cell-actions">
                    <button className="icon-btn" aria-label={`More actions for ${f.file_name}`}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="file-grid">
          {files.map((f) => (
            <Link to={`/file/${f._id}`} key={f._id} className="file-card">
              <div className="file-card-thumb">
                <FileIcon mime={f.mime_type} size={48} />
              </div>
              <div className="file-card-body">
                <FileIcon mime={f.mime_type} size={16} />
                <span className="truncate">{f.file_name}</span>
                {f.is_starred && <Star size={14} className="star" fill="currentColor" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
