import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { fileKind } from "../utils";
import FileIcon from "./FileIcon";

interface Props {
  url: string;
  name: string;
  mime: string;
  /** Asks for a new presigned link when the current one fails to load. */
  onReload: () => void;
}

/** Renders a presigned S3 URL with the right element for the file type. */
export default function FileViewer({ url, name, mime, onReload }: Props) {
  const [failed, setFailed] = useState(false);
  const kind = fileKind(mime);

  if (failed) {
    return (
      <div className="viewer-message">
        <FileIcon mime={mime} size={72} />
        <p className="muted">The preview could not be loaded. The link may have expired.</p>
        <button className="btn" onClick={onReload}>
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  }

  const onError = () => setFailed(true);

  switch (kind) {
    case "image":
      return <img className="viewer-media" src={url} alt={name} onError={onError} />;
    case "video":
      return <video className="viewer-media" src={url} controls onError={onError} />;
    case "audio":
      return <audio className="viewer-audio" src={url} controls onError={onError} />;
    case "pdf":
    case "text":
      // The browser renders these itself; iframes do not report load errors.
      return <iframe className="viewer-frame" src={url} title={name} />;
    default:
      return (
        <div className="viewer-message">
          <FileIcon mime={mime} size={72} />
          <p className="muted">No preview is available for this file type.</p>
          <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
            Open file
          </a>
        </div>
      );
  }
}
