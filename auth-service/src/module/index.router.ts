import { Router } from "express";
import authRoutes from "./auth/auth.router";

class IndexRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(authRoutes);
  }
}

export default new IndexRouter().router;
