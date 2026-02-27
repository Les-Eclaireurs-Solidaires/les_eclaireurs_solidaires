import "dotenv/config";
import { Database } from "./database/database.config.js";
import { AppConfig } from "./app.js";
import { UserRepository } from "./user/user.repository.js";
import { AuthService } from "./auth/auth.service.js";
import { AuthController } from "./auth/auth.controller.js";


const appConfig: AppConfig = new AppConfig();
appConfig.listen();