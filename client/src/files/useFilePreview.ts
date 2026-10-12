import { useCallback, useEffect, useState } from "react";
import { getFileData, getFilePreviewUrl } from "../api/files";
import { HttpError } from "../api/http";
import type { DriveFile } from "../types";

const messageOf = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

export interface FilePreviewState {
  file: DriveFile | null;
  fileLoading: boolean;
  fileError: string | null;
  notFound: boolean;
  previewUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  /** Fetches a fresh preview link, e.g. after the old one expired. */
  reloadPreview: () => void;
}

/**
 * Calls the file data and preview endpoints in parallel for one file.
 * Mount it with `key={id}` so state resets when the id changes.
 */
export function useFilePreview(id: string): FilePreviewState {
  const [file, setFile] = useState<DriveFile | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFileData(id)
      .then((data) => !cancelled && setFile(data))
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof HttpError && err.status === 404) setNotFound(true);
        else setFileError(messageOf(err));
      })
      .finally(() => !cancelled && setFileLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getFilePreviewUrl(id)
      .then((url) => {
        if (cancelled) return;
        setPreviewUrl(url);
        setPreviewError(null);
      })
      .catch((err: unknown) => !cancelled && setPreviewError(messageOf(err)))
      .finally(() => !cancelled && setPreviewLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, previewVersion]);

  const reloadPreview = useCallback(() => {
    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewVersion((v) => v + 1);
  }, []);

  return { file, fileLoading, fileError, notFound, previewUrl, previewLoading, previewError, reloadPreview };
}
