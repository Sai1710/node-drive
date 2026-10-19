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

export type UploadType = "SINGLE" | "MULTI";

/** Presigned part URLs from POST /file/upload/initialize (valid 1 hour). */
export interface InitializeUploadData {
  file_id: string;
  upload_urls: string[];
  upload_type: UploadType;
  upload_id: string | null;
}

export interface UploadPart {
  part_number: number;
  etag: string;
}

/** Finalizes a multipart upload after all parts are on S3. */
export function completeUpload(
  fileId: string,
  uploadId: string,
  parts: UploadPart[]
) {
  return request<ServerFile>(
    `${FILE_API_URL}/file/upload/complete/${encodeURIComponent(fileId)}`,
    {
      method: "POST",
      auth: true,
      body: { upload_id: uploadId, parts },
    }
  );
}

/** Creates the file record and returns presigned S3 upload URL(s). */
export function initializeUpload(file: File) {
  return request<InitializeUploadData>(
    `${FILE_API_URL}/file/upload/initialize`,
    {
      method: "POST",
      auth: true,
      body: {
        file_name: file.name,
        mime_type: contentTypeOf(file),
        size: file.size,
      },
    }
  );
}

/** XHR PUT to a presigned URL (fetch has no upload progress). */
function putBlobToS3(
  url: string,
  body: Blob,
  contentType: string | null,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(
            new HttpError(
              0,
              "Storage did not return an ETag. Add ETag to the bucket CORS ExposeHeaders."
            )
          );
          return;
        }
        resolve(etag);
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
    xhr.send(body);
  });
}

/** PUTs the file straight to S3. Content-Type must match what the URL was signed with. */
export function uploadToS3(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return putBlobToS3(url, file, contentTypeOf(file), onProgress, signal).then(
    () => undefined
  );
}

async function uploadMultipartToS3(
  file: File,
  uploadUrls: string[],
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<UploadPart[]> {
  const total = file.size;
  let uploadedBytes = 0;
  const chunkSize = Math.ceil(total / uploadUrls.length);
  const parts: UploadPart[] = [];

  for (let i = 0; i < uploadUrls.length; i++) {
    signal?.throwIfAborted();
    const start = i * chunkSize;
    const chunk = file.slice(start, Math.min(start + chunkSize, total));
    const partStart = uploadedBytes;

    const etag = await putBlobToS3(
      uploadUrls[i],
      chunk,
      null,
      (partPercent) => {
        const partLoaded = (partPercent / 100) * chunk.size;
        onProgress(Math.round(((partStart + partLoaded) / total) * 100));
      },
      signal
    );

    parts.push({ part_number: i + 1, etag });
    uploadedBytes += chunk.size;
    onProgress(Math.round((uploadedBytes / total) * 100));
  }

  return parts;
}

export async function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
) {
  const init = await initializeUpload(file);
  signal?.throwIfAborted();

  if (init.upload_type === "MULTI") {
    if (!init.upload_id) {
      throw new HttpError(500, "Multipart upload could not be started.");
    }
    const parts = await uploadMultipartToS3(
      file,
      init.upload_urls,
      onProgress,
      signal
    );
    signal?.throwIfAborted();
    await completeUpload(init.file_id, init.upload_id, parts);
    return;
  }

  const url = init.upload_urls[0];
  if (!url) throw new HttpError(500, "Upload could not be started.");
  await uploadToS3(url, file, onProgress, signal);
}
