import { Router } from "express";
import fileController from "./file.controller";
import { BASE_ROUTE, GET_FILE_ROUTE } from "./file.constants";

class FileRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get(BASE_ROUTE, fileController.getAllFiles);
    this.router.post(BASE_ROUTE, fileController.uploadFile);
    this.router.get(GET_FILE_ROUTE, fileController.getFile);
  }
}

export default new FileRouter().router;
