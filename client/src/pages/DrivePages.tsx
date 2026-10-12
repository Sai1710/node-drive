import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Clock, FolderOpen, Loader2, RefreshCw, Search, Star, Trash2, Upload, Users } from "lucide-react";
import FileBrowser from "../components/FileBrowser";
import { mockFiles } from "../data/mockFiles";
import { useDriveContext } from "../files/driveContext";

export function MyDrivePage() {
  const { openUpload, fileList } = useDriveContext();
  const { files, loading, error, reload } = fileList;

  const empty =
    loading && files.length === 0
      ? { icon: <Loader2 size={48} className="spin" />, title: "Loading your files…", message: "Fetching from file-service." }
      : error && files.length === 0
        ? { icon: <AlertCircle size={64} />, title: "Couldn't load your files", message: error }
        : { icon: <FolderOpen size={64} />, title: "Your Drive is empty", message: "Upload files to see them here." };

  return (
    <FileBrowser
      title="My Drive"
      files={files}
      actions={
        <>
          <button className="icon-btn" onClick={reload} disabled={loading} aria-label="Refresh files">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
          <button className="btn btn-primary" onClick={openUpload}>
            <Upload size={16} /> Upload
          </button>
        </>
      }
      banner={
        error && files.length > 0 ? (
          <div className="banner banner-error" role="alert">
            Couldn't refresh your files: {error}
          </div>
        ) : undefined
      }
      empty={empty}
    />
  );
}

export function SharedPage() {
  return (
    <FileBrowser
      title="Shared with me"
      files={mockFiles.filter((f) => f.shared_with_me && !f.is_trashed)}
      showOwner
      dateLabel="Shared date"
      empty={{ icon: <Users size={64} />, title: "Nothing shared yet", message: "Files others share with you appear here." }}
    />
  );
}

export function RecentPage() {
  const recent = mockFiles
    .filter((f) => !f.is_trashed)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);
  return (
    <FileBrowser
      title="Recent"
      files={recent}
      dateLabel="Last opened"
      empty={{ icon: <Clock size={64} />, title: "No recent files", message: "Files you open will show up here." }}
    />
  );
}

export function StarredPage() {
  return (
    <FileBrowser
      title="Starred"
      files={mockFiles.filter((f) => f.is_starred && !f.is_trashed)}
      empty={{ icon: <Star size={64} />, title: "No starred files", message: "Star files to find them quickly." }}
    />
  );
}

export function TrashPage() {
  const trashed = mockFiles.filter((f) => f.is_trashed);
  return (
    <FileBrowser
      title="Trash"
      files={trashed}
      dateLabel="Trashed date"
      actions={
        <button className="btn" disabled={trashed.length === 0}>
          Empty trash
        </button>
      }
      banner={<div className="banner">Items in trash are deleted forever after 30 days.</div>}
      empty={{ icon: <Trash2 size={64} />, title: "Trash is empty", message: "Deleted files appear here." }}
    />
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const results = mockFiles.filter((f) => !f.is_trashed && f.file_name.toLowerCase().includes(q.toLowerCase()));
  return (
    <FileBrowser
      title={`Results for “${q}”`}
      files={results}
      showOwner
      banner={
        <p className="muted back-link">
          <Link to="/drive">Back to My Drive</Link>
        </p>
      }
      empty={{ icon: <Search size={64} />, title: "No matching files", message: "Try a different search term." }}
    />
  );
}
