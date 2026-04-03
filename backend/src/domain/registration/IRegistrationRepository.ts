import type { Registration } from "./Registration.js";
import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

export interface IRegistrationRepository {
  saveRegistration(
    registration: Registration,
    missionUuid: string,
    connection?: any,
  ): Promise<void>;
  updateRegistrationStatus(
    targetUuid: string,
    missionUuid: string,
    registrationStatus: RegistrationStatus,
  ): Promise<boolean>;
}
