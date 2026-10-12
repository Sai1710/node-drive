import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Download, Loader2, Share2, Star, Trash2 } from "lucide-react";
import FileIcon from "../components/FileIcon";
import FileViewer from "../components/FileViewer";
import { findFile } from "../data/mockFiles";
import { useDriveContext } from "../files/driveContext";
import { useFilePreview } from "../files/useFilePreview";
import type { DriveFile } from "../types";
import { formatBytes, formatDate } from "../utils";
import NotFoundPage from "./NotFoundPage";

const STATUS_LABEL = { pending: "Pending", uploaded: "Uploaded", failed: "Failed" } as const;

export default function FilePreviewPage() {
  const { id = "" } = useParams();
  const mock = findFile(id);
  // Mock ids come from the pages that are not wired to the backend yet.
  if (mock) return <PreviewLayout file={mock} stage={<MockStage file={mock} />} />;
  return <LivePreview key={id} id={id} />;
}

function LivePreview({ id }: { id: string }) {
  const { fileList } = useDriveContext();
  const preview = useFilePreview(id);
  // Show the row from the listing until the file data call returns.
  const file = preview.file ?? fileList.files.find((f) => f._id === id) ?? null;

  if (preview.notFound) return <NotFoundPage message="This file does not exist or was removed." />;

  if (!file) {
    return preview.fileLoading ? (
      <div className="viewer-message">
        <Loader2 size={48} className="spin" />
        <p className="muted">Loading file…</p>
      </div>
    ) : (
      <div className="viewer-message">
        <AlertCircle size={48} className="fail" />
        <p className="form-error">{preview.fileError ?? "Could not load this file."}</p>
        <Link to="/drive" className="btn">
          Back to My Drive
        </Link>
      </div>
    );
  }

  let stage;
  if (preview.previewLoading) {
    stage = (
      <div className="viewer-message">
        <Loader2 size={48} className="spin" />
        <p className="muted">Loading preview…</p>
      </div>
    );
  } else if (preview.previewError || !preview.previewUrl) {
    stage = (
      <div className="viewer-message">
        <FileIcon mime={file.mime_type} size={72} />
        <p className="form-error">{preview.previewError ?? "No preview link was returned."}</p>
        <button className="btn" onClick={preview.reloadPreview}>
          Try again
        </button>
      </div>
    );
  } else {
    stage = (
      <FileViewer
        key={preview.previewUrl}
        url={preview.previewUrl}
        name={file.file_name}
        mime={file.mime_type}
        onReload={preview.reloadPreview}
      />
    );
  }

  return (
    <PreviewLayout
      file={file}
      stage={stage}
      downloadUrl={preview.previewUrl}
      detailsNote={preview.fileError && !preview.file ? `Showing cached details: ${preview.fileError}` : undefined}
    />
  );
}

function MockStage({ file }: { file: DriveFile }) {
  return (
    <div className="viewer-message">
      <FileIcon mime={file.mime_type} size={96} />
      <p className="muted">This is sample data, so there is nothing to preview.</p>
    </div>
  );
}

interface LayoutProps {
  file: DriveFile;
  stage: ReactNode;
  downloadUrl?: string | null;
  detailsNote?: string;
}

function PreviewLayout({ file, stage, downloadUrl, detailsNote }: LayoutProps) {
  const details: [string, string][] = [
    ["Type", file.mime_type],
    ["Size", formatBytes(file.size)],
    ["Owner", file.owner],
    ...(file.status ? [["Upload status", STATUS_LABEL[file.status]] as [string, string]] : []),
    ["Created", formatDate(file.createdAt)],
    ["Modified", formatDate(file.updatedAt)],
    ["Location", file.is_trashed ? "Trash" : file.shared_with_me ? "Shared with me" : "My Drive"],
  ];

  return (
    <section className="preview">
      <header className="preview-header">
        <Link to={file.is_trashed ? "/trash" : "/drive"} className="icon-btn" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <FileIcon mime={file.mime_type} size={24} />
        <h1 className="truncate">{file.file_name}</h1>
        <div className="preview-actions">
          <button className="icon-btn" aria-label="Star">
            <Star size={20} fill={file.is_starred ? "currentColor" : "none"} />
          </button>
          <button className="icon-btn" aria-label="Share">
            <Share2 size={20} />
          </button>
          <button className="icon-btn" aria-label="Move to trash">
            <Trash2 size={20} />
          </button>
          {downloadUrl ? (
            // Cross-origin links ignore the download attribute, so this opens a new tab.
            <a className="btn btn-primary" href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download size={16} /> Download
            </a>
          ) : (
            <button className="btn btn-primary" disabled>
              <Download size={16} /> Download
            </button>
          )}
        </div>
      </header>

      <div className="preview-body">
        <div className="preview-stage">{stage}</div>

        <aside className="details">
          <h2>Details</h2>
          {detailsNote && <p className="muted details-note">{detailsNote}</p>}
          <dl>
            {details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
