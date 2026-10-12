// Mirrors the file model used by file-service (@sakiriti/drive-common).
export interface DriveFile {
  _id: string;
  file_name: string;
  mime_type: string;
  size: number; // bytes
  is_trashed: boolean;
  is_starred: boolean;
  owner: string;
  shared_with_me: boolean;
  /** Upload state from file-service; absent on mock files. */
  status?: "pending" | "uploaded" | "failed";
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = "grid" | "list";
