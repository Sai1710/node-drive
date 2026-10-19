import { Router } from "express";
import fileController from "./file.controller";
import {
  COMPLETE_UPLOAD_ROUTE,
  GET_FILE_PREVIEW_ROUTE,
  GET_FILE_ROUTE,
  ROOT,
  UPLOAD_INITIALIZE_ROUTE,
  UPLOAD_ROUTE,
} from "./file.constants";
import fileMiddleware from "./file.middleware";
import FileController from "./file.controller";

class FileRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(
      UPLOAD_INITIALIZE_ROUTE,
      fileMiddleware.validateToken,
      FileController.initializeUpload
    );
    this.router.get(
      ROOT,
      fileMiddleware.validateToken,
      FileController.getAllFiles
    );
    this.router.post(
      COMPLETE_UPLOAD_ROUTE,
      fileMiddleware.validateToken,
      FileController.completeUpload
    );
    this.router.get(
      GET_FILE_PREVIEW_ROUTE,
      fileMiddleware.validateToken,
      FileController.getFilePreview
    );
    this.router.get(
      GET_FILE_ROUTE,
      fileMiddleware.validateToken,
      FileController.getFileData
    );
  }
}

export default new FileRouter().router;
