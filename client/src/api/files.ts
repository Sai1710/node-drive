import { FILE_API_URL } from "../config";
import type { DriveFile } from "../types";
import { HttpError, request } from "./http";

export const contentTypeOf = (file: File) =>
  file.type || "application/octet-stream";

/** A file document as file-service returns it (fileSchema in drive-common). */
export interface ServerFile {
  _id: string;
  user_id: string;
  parent_id: string | null;
  file_name: string;
  type: "file" | "folder";
  mime_type: string | null;
  size: number;
  s3_key: string | null;
  status: "pending" | "uploaded" | "failed";
  is_trashed: boolean;
  createdAt: string;
  updatedAt: string;
}

// The backend has no starring or sharing yet, so those fields get defaults.
const toDriveFile = (f: ServerFile): DriveFile => ({
  _id: f._id,
  file_name: f.file_name,
  mime_type: f.mime_type || "application/octet-stream",
  size: f.size ?? 0,
  is_trashed: f.is_trashed,
  is_starred: false,
  owner: "me",
  shared_with_me: false,
  status: f.status,
  createdAt: f.createdAt,
  updatedAt: f.updatedAt,
});

/** The signed-in user's files that are not in the trash, newest first. */
export async function listFiles(): Promise<DriveFile[]> {
  const data = await request<{ files: ServerFile[] }>(`${FILE_API_URL}/file`, {
    auth: true,
  });
  return (data?.files ?? []).map(toDriveFile);
}

/** One file's record (GET /file/:id). */
export async function getFileData(id: string): Promise<DriveFile> {
  const file = await request<ServerFile>(
    `${FILE_API_URL}/file/${encodeURIComponent(id)}`,
    { auth: true }
  );
  return toDriveFile(file);
}

/**
 * A presigned S3 GET URL for viewing the file (GET /file/preview/:id).
 * The backend uses the SDK default expiry, so the link dies after 15 minutes.
 */
export async function getFilePreviewUrl(id: string): Promise<string> {
  const data = await request<{ presigned_url: string }>(
    `${FILE_API_URL}/file/preview/${encodeURIComponent(id)}`,
    { auth: true }
  );
  return data.presigned_url;
}

/** Creates the file record and returns a presigned S3 PUT URL (POST /file/upload, valid 1 hour). */
export function requestUploadUrl(file: File) {
  return request<{ presigned_url: string }>(`${FILE_API_URL}/file/upload`, {
    method: "POST",
    auth: true,
    body: {
      file_name: file.name,
      content_type: contentTypeOf(file),
      size: file.size,
    },
  });
}

/**
 * PUTs the file straight to S3. Uses XHR because fetch has no upload progress.
 * The Content-Type must match the one the URL was signed with.
 */
export function uploadToS3(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentTypeOf(file));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(
          new HttpError(
            xhr.status,
            `Storage rejected the upload (status ${xhr.status}).`
          )
        );
      }
    };
    xhr.onerror = () =>
      reject(
        new HttpError(
          0,
          "Could not reach storage. Check that the S3 bucket CORS rules allow PUT from this site."
        )
      );
    xhr.onabort = () =>
      reject(new DOMException("Upload cancelled", "AbortError"));

    if (signal) {
      if (signal.aborted) return xhr.abort();
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}

export async function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
) {
  const { presigned_url } = await requestUploadUrl(file);
  signal?.throwIfAborted();
  await uploadToS3(presigned_url, file, onProgress, signal);
}
