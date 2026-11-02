import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
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
  /** Row actions; the menu only shows when at least one is given. */
  onRename?: (file: DriveFile) => void;
  onDelete?: (file: DriveFile) => void;
}

const isFolder = (f: DriveFile) => f.type === "folder";
const hrefOf = (f: DriveFile) => (isFolder(f) ? `/drive/folders/${f._id}` : `/file/${f._id}`);

export default function FileBrowser({
  title,
  files,
  empty,
  actions,
  banner,
  showOwner,
  dateLabel = "Last modified",
  onRename,
  onDelete,
}: Props) {
  const [view, setView] = useState<ViewMode>("list");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasActions = Boolean(onRename || onDelete);

  // Close the row menu on any click outside it.
  useEffect(() => {
    if (!menuFor) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuFor(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuFor(null);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  const runAction = (action: ((file: DriveFile) => void) | undefined, file: DriveFile) => {
    setMenuFor(null);
    action?.(file);
  };

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
                    <Link to={hrefOf(f)} className="file-name">
                      <FileIcon mime={f.mime_type} folder={isFolder(f)} />
                      <span className="truncate">{f.file_name}</span>
                      {f.is_starred && <Star size={14} className="star" fill="currentColor" />}
                    </Link>
                  </td>
                  {showOwner && <td className="muted">{f.owner}</td>}
                  <td className="muted hide-sm">{formatDate(f.updatedAt)}</td>
                  <td className="muted hide-sm">{isFolder(f) ? "—" : formatBytes(f.size)}</td>
                  <td className="cell-actions">
                    {hasActions && (
                      <div className="row-menu-wrap" ref={menuFor === f._id ? menuRef : undefined}>
                        <button
                          className="icon-btn"
                          aria-label={`More actions for ${f.file_name}`}
                          aria-haspopup="menu"
                          aria-expanded={menuFor === f._id}
                          onClick={() => setMenuFor((id) => (id === f._id ? null : f._id))}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {menuFor === f._id && (
                          <div className="row-menu" role="menu">
                            {onRename && (
                              <button role="menuitem" onClick={() => runAction(onRename, f)}>
                                <Pencil size={16} /> Rename
                              </button>
                            )}
                            {onDelete && (
                              <button role="menuitem" onClick={() => runAction(onDelete, f)}>
                                <Trash2 size={16} /> Move to trash
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="file-grid">
          {files.map((f) => (
            <Link to={hrefOf(f)} key={f._id} className="file-card">
              <div className="file-card-thumb">
                <FileIcon mime={f.mime_type} size={48} folder={isFolder(f)} />
              </div>
              <div className="file-card-body">
                <FileIcon mime={f.mime_type} size={16} folder={isFolder(f)} />
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
