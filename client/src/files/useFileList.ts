import { useCallback, useEffect, useState } from "react";
import { listFiles } from "../api/files";
import type { DriveFile } from "../types";

export interface FileListState {
  /** The folder these files belong to ("root" for the top of My Drive). */
  folderId: string;
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface Loaded {
  key: string;
  folderId: string;
  files: DriveFile[];
  error: string | null;
}

/** Loads one folder's files, again when the folder changes, and whenever `reload` is called. */
export function useFileList(folderId: string): FileListState {
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${folderId}:${version}`;

  useEffect(() => {
    let cancelled = false;
    listFiles(folderId)
      .then((files) => !cancelled && setLoaded({ key, folderId, files, error: null }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const error = err instanceof Error ? err.message : "Could not load your files.";
        // Keep the old rows on a failed refresh of the same folder.
        setLoaded((prev) => ({ key, folderId, files: prev?.folderId === folderId ? prev.files : [], error }));
      });
    return () => {
      cancelled = true;
    };
  }, [folderId, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Rows from another folder are never shown while the new one loads.
  const sameFolder = loaded?.folderId === folderId;
  return {
    folderId,
    files: sameFolder ? loaded.files : [],
    loading: loaded?.key !== key,
    error: sameFolder ? loaded.error : null,
    reload,
  };
}
