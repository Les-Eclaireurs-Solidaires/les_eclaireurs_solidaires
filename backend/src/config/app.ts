import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "../middleware/error.middleware.js";
import { Database } from "../database/database.config.js";
import { UserRepository } from "../modules/user/user.repository.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { AuthController } from "../modules/auth/auth.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";


export class AppConfig {
  private app: express.Application;
  private port: number;
  private host: string;

  constructor(private authController: AuthController) {
    this.app = express();
    this.port = Number(process.env.PORT);
    this.host = process.env.HOST!;
    //this.initializeDependencies();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /* private initializeDependencies() {
    const databaseConfig = Database.getInstance().getConnection();
    const userRepository = new UserRepository(databaseConfig);
    const authService = new AuthService(userRepository);

    this.authController = new AuthController(authService);
  } */

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
