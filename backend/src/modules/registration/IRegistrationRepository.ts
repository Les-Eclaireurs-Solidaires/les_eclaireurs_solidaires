import type { Registration } from "./RegistrationModel.js";
import type { RegistrationStatus } from "./RegistrationStatusEnum.js";

export interface IRegistrationRepository {
  saveRegistration(registration: Registration): Promise<void>;
  updateRegistrationStatus(
    targetUuid: string,
    missionUuid: string,
    registrationStatus: RegistrationStatus,
  ): Promise<void>;
}
