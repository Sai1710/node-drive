import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FileType,
  type LucideIcon,
} from "lucide-react";
import { fileKind, type FileKind } from "../utils";

const icons: Record<FileKind, { Icon: LucideIcon; color: string }> = {
  image: { Icon: FileImage, color: "#e8710a" },
  video: { Icon: FileVideo, color: "#d93025" },
  audio: { Icon: FileAudio, color: "#9334e6" },
  pdf: { Icon: FileType, color: "#d93025" },
  doc: { Icon: FileText, color: "#1a73e8" },
  sheet: { Icon: FileSpreadsheet, color: "#188038" },
  archive: { Icon: FileArchive, color: "#5f6368" },
  text: { Icon: FileText, color: "#5f6368" },
  other: { Icon: File, color: "#5f6368" },
};

export default function FileIcon({ mime, size = 20 }: { mime: string; size?: number }) {
  const { Icon, color } = icons[fileKind(mime)];
  return <Icon size={size} color={color} aria-hidden />;
}
