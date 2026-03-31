import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { envConfig } from "../config/EnvConfig.js";
import type { Server } from "node:http";

export class AppConfig {
  private app: Express;
  private port: number;
  private host: string;
  private server?: Server;


  constructor(
  ) {
    this.app = express();
    this.port = envConfig.port;
    this.host = envConfig.host;
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(helmet());
    this.app.use(
      cors(),
    );
    this.app.use(cookieParser());
  }

  private initializeRoutes() {
    this.app.get("/", (req, res) => {
      res.send("Hello World!");
    });
  }

  public listen() {
    this.server = this.app.listen(this.port, this.host, () => {
      console.log(`Server started on http://${this.host}:${this.port}`);
    });
  }

  public getApp(): Express {
    return this.app;
  }
}
