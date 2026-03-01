import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { UserRepository } from "./modules/user/user.repository.js";
import { Database } from "./database/database.config.js";
import { errorHandler } from "./middleware/error.middleware.js";

export class AppConfig {
  private app: express.Application;
  private port: number;
  private host: string;
  private authController!: AuthController;

  constructor() {
    this.app = express();
    this.port = Number(process.env.PORT);
    this.host = process.env.HOST!;
    this.initializeDependencies();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeDependencies() {
    const databaseConfig = Database.getInstance().getConnection();
    const userRepository = new UserRepository(databaseConfig);
    const authService = new AuthService(userRepository);

    this.authController = new AuthController(authService);
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
    //this.app.use(cors({ origin: 'url_du_front' }));
    this.app.use(helmet());
    this.app.use(cookieParser());
  }

  private initializeRoutes() {
    this.app.get("/", (req, res) => {
      res.send("Hello World!");
    });
    this.app.use("/auth", this.authController.getRouter());
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
