import { useOutletContext } from "react-router-dom";
import type { FileListState } from "./useFileList";

/** What DriveLayout shares with the pages it renders. */
export interface DriveContext {
  openUpload: () => void;
  fileList: FileListState;
}

export const useDriveContext = () => useOutletContext<DriveContext>();
