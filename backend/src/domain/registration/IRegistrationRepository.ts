import type { Pool, PoolConnection } from "mysql2/promise";
import type { Registration } from "./Registration.js";

export interface IRegistrationRepository {
  saveRegistration(
    registration: Registration,
    missionUuid: string,
    connection?: Pool | PoolConnection,
  ): Promise<void>;
}
