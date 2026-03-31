import "reflect-metadata";
import { AppConfig } from "./infra/web/AppConfig.js";

const appConfig: AppConfig = new AppConfig();
appConfig.listen();
