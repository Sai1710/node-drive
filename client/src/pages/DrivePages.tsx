import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  FolderOpen,
  FolderPlus,
  Loader2,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { createFolder, deleteFile, getFileData, renameFile } from "../api/files";
import { HttpError } from "../api/http";
import FileBrowser from "../components/FileBrowser";
import NameDialog from "../components/NameDialog";
import { mockFiles } from "../data/mockFiles";
import { useDriveContext } from "../files/driveContext";
import type { DriveFile } from "../types";
import NotFoundPage from "./NotFoundPage";

export function MyDrivePage() {
  const { folderId = null } = useParams();
  // Reset dialogs and errors when moving between folders.
  return <FolderView key={folderId ?? "root"} folderId={folderId} />;
}

type Dialog = { kind: "new-folder" } | { kind: "rename"; file: DriveFile } | null;

/** One folder of My Drive; `folderId` is null at the top level. */
function FolderView({ folderId }: { folderId: string | null }) {
  const { openUpload, fileList } = useDriveContext();
  const { files, loading, error, reload } = fileList;
  const folder = useFolder(folderId);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (folder.notFound) return <NotFoundPage message="This folder does not exist or was removed." />;

  const moveToTrash = async (file: DriveFile) => {
    setActionError(null);
    try {
      await deleteFile(file._id);
      reload();
    } catch (err) {
      setActionError(`Couldn't move “${file.file_name}” to trash: ${messageOf(err)}`);
    }
  };

  const empty =
    loading && files.length === 0
      ? { icon: <Loader2 size={48} className="spin" />, title: "Loading your files…", message: "Fetching from file-service." }
      : error && files.length === 0
        ? { icon: <AlertCircle size={64} />, title: "Couldn't load your files", message: error }
        : folderId === null
          ? { icon: <FolderOpen size={64} />, title: "Your Drive is empty", message: "Upload files or create a folder to see them here." }
          : { icon: <FolderOpen size={64} />, title: "This folder is empty", message: "Upload files or create a folder here." };

  const parentHref = folder.data?.parent_id ? `/drive/folders/${folder.data.parent_id}` : "/drive";

  return (
    <>
      <FileBrowser
        title={folderId === null ? "My Drive" : (folder.data?.file_name ?? "Loading…")}
        files={files}
        onRename={(file) => setDialog({ kind: "rename", file })}
        onDelete={moveToTrash}
        actions={
          <>
            <button className="icon-btn" onClick={reload} disabled={loading} aria-label="Refresh files">
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
            <button className="btn" onClick={() => setDialog({ kind: "new-folder" })}>
              <FolderPlus size={16} /> New folder
            </button>
            <button className="btn btn-primary" onClick={openUpload}>
              <Upload size={16} /> Upload
            </button>
          </>
        }
        banner={
          <>
            {folderId !== null && (
              <Link to={parentHref} className="folder-up">
                <ArrowLeft size={16} /> Back
              </Link>
            )}
            {folder.error && (
              <div className="banner banner-error" role="alert">
                Couldn't load this folder's details: {folder.error}
              </div>
            )}
            {actionError && (
              <div className="banner banner-error" role="alert">
                {actionError}
              </div>
            )}
            {error && files.length > 0 && (
              <div className="banner banner-error" role="alert">
                Couldn't refresh your files: {error}
              </div>
            )}
          </>
        }
        empty={empty}
      />

      {dialog?.kind === "new-folder" && (
        <NameDialog
          title="New folder"
          label="Folder name"
          submitLabel="Create"
          initialValue="Untitled folder"
          onClose={() => setDialog(null)}
          onSubmit={async (name) => {
            await createFolder(name, folderId);
            reload();
          }}
        />
      )}
      {dialog?.kind === "rename" && (
        <NameDialog
          title="Rename"
          label="New name"
          submitLabel="Rename"
          initialValue={dialog.file.file_name}
          onClose={() => setDialog(null)}
          onSubmit={async (name) => {
            await renameFile(dialog.file._id, name);
            reload();
          }}
        />
      )}
    </>
  );
}

const messageOf = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

/** The open folder's own record, for its name and parent. Nothing to load at the root. */
function useFolder(folderId: string | null) {
  const [data, setData] = useState<DriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (folderId === null) return;
    let cancelled = false;
    getFileData(folderId)
      .then((file) => {
        if (cancelled) return;
        if (file.type === "folder") setData(file);
        else setNotFound(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof HttpError && err.status === 404) setNotFound(true);
        else setError(messageOf(err));
      });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  return { data, error, notFound };
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
