import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "../middleware/error.middleware.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import type { RegistrationController } from "../modules/registration/registration.controller.js";
import type { MissionController } from "../modules/mission/mission.controller.js";


export class AppConfig {
  private app: express.Application;
  private port: number;
  private host: string;

  constructor(private authController: AuthController, private missionController: MissionController, private registrationController: RegistrationController) {
    this.app = express();
    this.port = Number(process.env.PORT);
    this.host = process.env.HOST!;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors({
      origin: 'http://localhost:4200',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
      exposedHeaders: ['X-XSRF-TOKEN'],
    }));
    this.app.use(helmet());
    this.app.use(cookieParser());
    this.app.use(csrfProtection);
  }

  private initializeRoutes() {
    this.app.get("/", (req, res) => {
      res.send("Hello World!");
    });
    this.app.use("/auth", this.authController.getRouter());
    this.app.use("/mission", this.missionController.getRouter());
    this.app.use("/mission/:missionUuid", this.registrationController.getRouter());
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  public listen() {
    this.app.listen(this.port, this.host, () => {
      console.log(`Server started on http://${this.host}:${this.port}`);
    });
  }

  public getApp() {
    return this.app;
  }
}
