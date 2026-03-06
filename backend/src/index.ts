import "dotenv/config";
import { AppConfig } from "./config/app.js"
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { UserRepository } from "./modules/user/user.repository.js";
import { Database } from "./database/database.config.js";
import { HashUtil } from "./utils/hash.util.js";

const database = Database.getInstance().getConnection();
const hashUtil = new HashUtil() ;
const userRepository = new UserRepository(database);

const authService = new AuthService(userRepository, hashUtil);
const authController = new AuthController(authService);

const appConfig: AppConfig = new AppConfig(authController);
appConfig.listen();
