import { Router } from "express";

class IndexRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {}
}

export default new IndexRouter().router;
