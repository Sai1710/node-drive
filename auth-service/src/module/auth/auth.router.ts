import { Router } from "express";
import {
  LOGIN_ROUTE,
  LOGOUT_ROUTE,
  REFRESH_SESSION_ROUTE,
  SIGNUP_ROUTE,
} from "./auth.constants";
import authControllers from "./auth.controllers";
import authMiddleware from "./auth.middleware";

class AuthRouter {
  router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post(SIGNUP_ROUTE, authControllers.signup);
    this.router.post(LOGIN_ROUTE, authControllers.login);
    this.router.post(REFRESH_SESSION_ROUTE, authControllers.refreshSession);
    this.router.post(
      LOGOUT_ROUTE,
      authMiddleware.validateToken,
      authControllers.logout,
    );
  }
}

export default new AuthRouter().router;
