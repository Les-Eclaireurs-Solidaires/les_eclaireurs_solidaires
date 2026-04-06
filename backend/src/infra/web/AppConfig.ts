import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { envConfig } from "../config/EnvConfig.js";
import { csrfProtection } from "./middlewares/CSRFMiddleware.js";
import { errorHandler } from "./middlewares/ErrorMiddleware.js";
import type { Server } from "node:http";
import { Database } from "../database/DatabaseConfig.js";
import type { MissionController } from "../../presentation/MissionController.js";
import type { AuthController } from "../../presentation/AuthController.js";

export class AppConfig {
  private app: Express;
  private port: number;
  private host: string;
  private server?: Server;

  constructor(
    private authController: AuthController,
    private missionController: MissionController,
  ) {
    this.app = express();
    this.port = envConfig.port;
    this.host = envConfig.host;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: "http://localhost:4200",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "X-XSRF-TOKEN"],
        exposedHeaders: ["X-XSRF-TOKEN"],
      }),
    );
    this.app.use(cookieParser());
    this.app.use(csrfProtection);
  }

  private initializeRoutes() {
    this.app.get("/api", (req, res) => {
      res.json({ message: "Hello les Eclaireurs !" });
    });
    this.app.use("/auth", this.authController.getRouter());
    this.app.use("/mission", this.missionController.getRouter());
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  public listen() {
    this.server = this.app.listen(this.port, this.host, () => {
      console.log(`Server started on http://${this.host}:${this.port}`);
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(async (err) => {
          if (err) return reject(err);
          // Quand le serveur Express est coupé, on coupe la base de données !
          await Database.getInstance().disconnect();
          resolve();
        });
      } else {
        // Si le serveur n'a jamais démarré (ex: pendant certains tests)
        Database.getInstance().disconnect().then(resolve).catch(reject);
      }
    });
  }

  public getApp(): Express {
    return this.app;
  }
}
