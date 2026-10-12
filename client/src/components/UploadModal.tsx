import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, UploadCloud, X } from "lucide-react";
import { uploadFile } from "../api/files";
import { formatBytes } from "../utils";
import FileIcon from "./FileIcon";

type Status = "queued" | "uploading" | "done" | "error";

interface UploadItem {
  id: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
}

let nextId = 0;

interface Props {
  onClose: () => void;
  /** Called after a batch in which at least one file uploaded. */
  onUploaded?: () => void;
}

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight upload when the dialog closes.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (id: string, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const added = Array.from(list).map((file) => ({
      id: `upload-${nextId++}`,
      file,
      status: "queued" as const,
      progress: 0,
    }));
    setItems((prev) => [...prev, ...added]);
  };

  const pending = items.filter((it) => it.status === "queued" || it.status === "error");
  const allDone = items.length > 0 && items.every((it) => it.status === "done");

  const startUpload = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);

    let uploadedAny = false;
    // One at a time keeps progress readable and avoids flooding the service.
    for (const item of pending) {
      if (controller.signal.aborted) break;
      update(item.id, { status: "uploading", progress: 0, error: undefined });
      try {
        await uploadFile(item.file, (progress) => update(item.id, { progress }), controller.signal);
        update(item.id, { status: "done", progress: 100 });
        uploadedAny = true;
      } catch (err) {
        if (controller.signal.aborted) break;
        update(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    }

    // Refresh the drive listing so new files show up, even if the dialog was closed.
    if (uploadedAny) onUploaded?.();
    if (!controller.signal.aborted) setRunning(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="upload-title">Upload files</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <button
          type="button"
          className={`dropzone ${dragging ? "dragging" : ""}`}
          disabled={running}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!running) addFiles(e.dataTransfer.files);
          }}
        >
          <UploadCloud size={40} />
          <span>
            Drag files here or <span className="link">browse</span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow picking the same file again
          }}
        />

        {items.length > 0 && (
          <ul className="upload-list">
            {items.map((it) => (
              <li key={it.id}>
                <FileIcon mime={it.file.type} />
                <div className="upload-item">
                  <div className="upload-item-row">
                    <span className="truncate">{it.file.name}</span>
                    <span className="muted">{formatBytes(it.file.size)}</span>
                  </div>
                  {it.status === "uploading" && (
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuenow={it.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading ${it.file.name}`}
                    >
                      <div style={{ width: `${it.progress}%` }} />
                    </div>
                  )}
                  {it.status === "error" && <span className="upload-error">{it.error}</span>}
                </div>
                {it.status === "done" && <CheckCircle2 size={18} className="ok" aria-label="Uploaded" />}
                {it.status === "error" && <AlertCircle size={18} className="fail" aria-label="Failed" />}
                {it.status === "uploading" && <span className="muted">{it.progress}%</span>}
                {it.status === "queued" && !running && (
                  <button
                    className="icon-btn small"
                    onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                    aria-label={`Remove ${it.file.name}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <footer className="modal-footer">
          <button className="btn" onClick={onClose}>
            {allDone ? "Close" : "Cancel"}
          </button>
          {!allDone && (
            <button className="btn btn-primary" disabled={pending.length === 0 || running} onClick={startUpload}>
              {running
                ? "Uploading…"
                : pending.some((p) => p.status === "error")
                  ? `Retry (${pending.length})`
                  : `Upload${pending.length > 0 ? ` (${pending.length})` : ""}`}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
