import { Router } from "express";
import authRoutes from "./auth/auth.router";
import { AUTH_ROUTE } from "./auth/auth.endpoints";

class IndexRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AUTH_ROUTE, authRoutes);
  }
}

export default new IndexRouter().router;
