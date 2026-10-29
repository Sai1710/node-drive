import { Router } from "express";
import {
  COMPLETE_UPLOAD_ROUTE,
  GET_FILE_PREVIEW_ROUTE,
  GET_FILE_ROUTE,
  RENAME_FILE_ROUTE,
  ROOT,
  UPLOAD_INITIALIZE_ROUTE,
} from "./file.constants";
import fileController from "./file.controller";
import FileMiddleware from "./file.middleware";

class FileRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(
      UPLOAD_INITIALIZE_ROUTE,
      FileMiddleware.validateToken,
      fileController.initializeUpload
    );
    this.router.get(
      ROOT,
      FileMiddleware.validateToken,
      fileController.getAllFiles
    );
    this.router.post(
      COMPLETE_UPLOAD_ROUTE,
      FileMiddleware.validateToken,
      fileController.completeUpload
    );
    this.router.get(
      GET_FILE_PREVIEW_ROUTE,
      FileMiddleware.validateToken,
      fileController.getFilePreview
    );
    this.router.put(
      RENAME_FILE_ROUTE,
      FileMiddleware.validateToken,
      fileController.renameFile
    );
    this.router.get(
      GET_FILE_ROUTE,
      FileMiddleware.validateToken,
      fileController.getFileData
    );
    this.router.delete(
      GET_FILE_ROUTE,
      FileMiddleware.validateToken,
      fileController.deleteFile
    );
  }
}

export default new FileRouter().router;
