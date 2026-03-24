import "dotenv/config";
import { AppConfig } from "./config/app.js"
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { UserRepository } from "./modules/user/user.repository.js";
import { Database } from "./database/database.config.js";
import { HashUtil } from "./utils/hash.util.js";
import { MissionService } from "./modules/mission/mission.service.js";
import { MissionController } from "./modules/mission/mission.controller.js";
import { RegistrationController } from "./modules/registration/registration.controller.js";
import { RegistrationService } from "./modules/registration/registration.service.js";
import { MissionRepository } from "./modules/mission/mission.repository.js";
import { RegistrationRepository } from "./modules/registration/registration.repository.js";

const database = Database.getInstance().getConnection();
const hashUtil = new HashUtil() ;
const userRepository = new UserRepository(database);
const missionRepository = new MissionRepository(database);
const registrationRepository = new RegistrationRepository(database);

const authService = new AuthService(userRepository, hashUtil);
const authController = new AuthController(authService);

const missionService = new MissionService(missionRepository);
const missionController = new MissionController(missionService);

const registrationService = new RegistrationService(missionRepository, registrationRepository, userRepository);
const registrationController = new RegistrationController(registrationService);

const appConfig: AppConfig = new AppConfig(authController, missionController, registrationController);
appConfig.listen();
