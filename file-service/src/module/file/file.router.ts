import { Router } from "express";
import fileController from "./file.controller";
import {
  BASE_ROUTE,
  GET_FILE_PREVIEW_ROUTE,
  GET_FILE_ROUTE,
  UPLOAD_ROUTE,
} from "./file.constants";
import fileMiddleware from "./file.middleware";

class FileRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get(
      BASE_ROUTE,
      fileMiddleware.validateToken,
      fileController.getAllFiles
    );
    this.router.post(
      UPLOAD_ROUTE,
      fileMiddleware.validateToken,
      fileController.uploadFile
    );
    this.router.get(
      GET_FILE_PREVIEW_ROUTE,
      fileMiddleware.validateToken,
      fileController.getFilePreview
    );
    this.router.get(
      GET_FILE_ROUTE,
      fileMiddleware.validateToken,
      fileController.getFileData
    );
  }
}

export default new FileRouter().router;
