import { useCallback, useEffect, useState } from "react";
import { listFiles } from "../api/files";
import type { DriveFile } from "../types";

export interface FileListState {
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads the user's files on mount and again whenever `reload` is called. */
export function useFileList(): FileListState {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listFiles()
      .then((result) => {
        if (cancelled) return;
        setFiles(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your files.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  return { files, loading, error, reload };
}
