import express, { Router } from "express";
import cors from "cors";
import indexRouter from "../module/index.router";

class App {
  app: express.Express;

  constructor() {
    this.app = express();
    this.configureApplication();
  }

  private configureApplication() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cors());

    this.app.use(indexRouter);
  }
}

export default new App();
