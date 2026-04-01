import "reflect-metadata";
import { AuthService } from "./modules/auth/AuthService.js";
import { AuthController } from "./modules/auth/AuthController.js";
import { UserRepository } from "./modules/user/UserRepository.js";
import { Database } from "./infra/database/DatabaseConfig.js";
import { AppConfig } from "./infra/web/AppConfig.js";
import { HashService } from "./infra/security/HashService.js";
import { TokenService } from "./infra/security/TokenService.js";
import { MissionController } from "./modules/mission/MissionController.js";
import { MissionService } from "./modules/mission/MissionService.js";
import { Mission } from "./modules/mission/MissionModel.js";
import { MissionRepository } from "./modules/mission/MissionRepository.js";

const database = Database.getInstance().getConnection();
const hashService = new HashService();
const tokenService = new TokenService();
const userRepository = new UserRepository(database);
const missionRepository = new MissionRepository(database);

const authService = new AuthService(userRepository, hashService, tokenService);
const authController = new AuthController(authService, tokenService);

const missionService = new MissionService(missionRepository);

const missionController = new MissionController(missionService, tokenService);

const appConfig: AppConfig = new AppConfig(authController, missionController);
appConfig.listen();
