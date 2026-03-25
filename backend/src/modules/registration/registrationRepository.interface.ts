import type { Registration } from "./registration.model.js";
import type { RegistrationStatus } from "./registrationStatus.enum.js";

export interface IRegistrationRepository {
  saveRegistration(registration: Registration): Promise<void>;
  updateRegistrationStatus(targetUuid: string, missionUuid: string, registrationStatus:RegistrationStatus): Promise<void>;
}
