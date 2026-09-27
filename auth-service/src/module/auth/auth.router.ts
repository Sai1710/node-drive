import { Router } from "express";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "./auth.constants";
import authControllers from "./auth.controllers";

class AuthRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(SIGNUP_ROUTE, authControllers.signup);
    this.router.post(LOGIN_ROUTE, authControllers.login);
  }
}

export default new AuthRouter().router;
