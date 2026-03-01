import "dotenv/config";
import { Database } from "./database/database.config.js";
import { AppConfig } from "./app.js";
import { UserRepository } from "./modules/user/user.repository.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";

const appConfig: AppConfig = new AppConfig();
appConfig.listen();
