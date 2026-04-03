import "reflect-metadata";
import { AuthService } from "./domain/auth/AuthService.js";
import { AuthController } from "./domain/auth/AuthController.js";
import { UserRepository } from "./domain/user/UserRepository.js";
import { Database } from "./infra/database/DatabaseConfig.js";
import { AppConfig } from "./infra/web/AppConfig.js";
import { HashService } from "./infra/security/HashService.js";
import { TokenService } from "./infra/security/TokenService.js";
import { MissionController } from "./presentation/MissionController.js";
import { MissionService } from "./domain/mission/MissionService.js";
import { MissionRepository } from "./domain/mission/MissionRepository.js";
import { RegistrationRepository } from "./domain/registration/RegistrationRepository.js";
import type { Pool } from "mysql2/promise";

const database: Pool = Database.getInstance().getPool();

const hashService = new HashService();
const tokenService = new TokenService();

const userRepository = new UserRepository(database);
const missionRepository = new MissionRepository(database);
const registrationRepository = new RegistrationRepository(database);

const authService = new AuthService(userRepository, hashService, tokenService);
const authController = new AuthController(authService, tokenService);

const missionService = new MissionService(
  missionRepository,
  registrationRepository,
  userRepository,
  database,
);
const missionController = new MissionController(missionService, tokenService);

const appConfig: AppConfig = new AppConfig(authController, missionController);
appConfig.listen();
