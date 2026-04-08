import "reflect-metadata";
import { UserRepository } from "./infra/repositories/UserRepository.js";
import { Database } from "./infra/database/DatabaseConfig.js";
import { AppConfig } from "./infra/web/AppConfig.js";
import { HashService } from "./infra/security/HashService.js";
import { TokenService } from "./infra/security/TokenService.js";
import { MissionController } from "./presentation/MissionController.js";
import { MissionService } from "./application/MissionService.js";
import type { Pool } from "mysql2/promise";
import { MissionRepository } from "./infra/repositories/MissionRepository.js";
import { RegistrationRepository } from "./infra/repositories/RegistrationRepository.js";
import { AuthService } from "./application/AuthService.js";
import { AuthController } from "./presentation/AuthController.js";
import EventEmitter from "node:events";
import { EventHandler } from "./infra/web/handler/EventHandler.js";

const database: Pool = Database.getInstance().getPool();

const hashService = new HashService();
const tokenService = new TokenService();

const eventBus = new EventEmitter();

const userRepository = new UserRepository(database);
const missionRepository = new MissionRepository(database);
const registrationRepository = new RegistrationRepository(database);

const eventHandler = new EventHandler(registrationRepository);
eventBus.on("MissionSynchroOrgaRegistEvent", (event, connection) => {
  eventHandler.handleRegistrationsUpdateEvent(event, connection);
});

const authService = new AuthService(userRepository, hashService, tokenService);
const authController = new AuthController(authService, tokenService);

const missionService = new MissionService(
  missionRepository,
  registrationRepository,
  userRepository,
  database,
  eventBus,
);
const missionController = new MissionController(missionService, tokenService);

const appConfig: AppConfig = new AppConfig(authController, missionController);
appConfig.listen();
