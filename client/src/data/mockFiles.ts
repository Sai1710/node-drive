import type { DriveFile } from "../types";

// Placeholder data until the file-service APIs are wired up.
export const mockUser = {
  name: "Sai Kiriti",
  email: "sai@example.com",
  storageUsed: 6.4 * 1024 ** 3,
  storageTotal: 15 * 1024 ** 3,
};

const day = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * day).toISOString();

const SHEET = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOC = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const make = (
  id: number,
  file_name: string,
  mime_type: string,
  size: number,
  days: number,
  extra: Partial<DriveFile> = {},
): DriveFile => ({
  _id: `file-${id}`,
  file_name,
  mime_type,
  size,
  is_trashed: false,
  is_starred: false,
  owner: "me",
  shared_with_me: false,
  createdAt: ago(days),
  updatedAt: ago(days),
  ...extra,
});

export const mockFiles: DriveFile[] = [
  make(1, "Project Proposal.pdf", "application/pdf", 2_450_000, 0, { is_starred: true }),
  make(2, "Team Photo.jpg", "image/jpeg", 4_120_000, 1),
  make(3, "Budget 2026.xlsx", SHEET, 380_000, 2, { is_starred: true }),
  make(4, "Meeting Notes.docx", DOC, 96_000, 3),
  make(5, "Product Demo.mp4", "video/mp4", 186_000_000, 5),
  make(6, "Logo.png", "image/png", 220_000, 7),
  make(7, "Podcast Episode 12.mp3", "audio/mpeg", 48_000_000, 9),
  make(8, "source-code.zip", "application/zip", 12_800_000, 12),
  make(9, "README.md", "text/markdown", 4_200, 14),
  make(10, "Q3 Report.pdf", "application/pdf", 1_900_000, 4, { owner: "Priya Shah", shared_with_me: true }),
  make(11, "Design Mockups.png", "image/png", 3_400_000, 6, { owner: "Alex Kim", shared_with_me: true, is_starred: true }),
  make(12, "Roadmap.xlsx", SHEET, 150_000, 10, { owner: "Priya Shah", shared_with_me: true }),
  make(13, "Old Draft.docx", DOC, 64_000, 20, { is_trashed: true }),
  make(14, "Screenshot 2026-08-01.png", "image/png", 890_000, 30, { is_trashed: true }),
];

export const findFile = (id: string) => mockFiles.find((f) => f._id === id);
