import { Router } from "express";
import { FILE_ROUTE } from "./file/file.constants";
import fileRouter from "./file/file.router";

class IndexRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(FILE_ROUTE, fileRouter);
  }
}

export default new IndexRouter().router;
