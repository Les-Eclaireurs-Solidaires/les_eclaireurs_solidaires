import type { Registration } from "../../registration/Registration.js";
import { RegistrationStatus } from "../../registration/RegistrationStatusEnum.js";
import { MissionDateError } from "../exceptions/MissionDateError.js";
import { MissionStatusError } from "../exceptions/MissionStatusError.js";
import { Mission } from "../Mission.js";
import { MissionState } from "../MissionState.js";

export class FinishedState extends MissionState {
  validate(mission: Mission): void {
    const now = new Date();
    if (now.getTime() < mission.getDateEnd().getTime()) {
      throw new MissionDateError(
        "Impossible de terminer une mission qui n'est pas encore arrivée à sa date de fin.",
      );
    }
    if (now.getTime() < mission.getDateEnd().getTime()) {
      throw new MissionDateError(
        "Impossible de terminer une mission qui n'est pas terminée.",
      );
    }
    const hasValidParticipants = mission.getRegistrations().some(
      (registration) => 
        registration.getStatus() === RegistrationStatus.VALIDATED ||
        registration.getStatus() === RegistrationStatus.PRESENT ||
        registration.getStatus() === RegistrationStatus.ABSENT
    );

    if (!hasValidParticipants) {
      throw new MissionStatusError(
        "Impossible de terminer une mission sans aucun participant valide.",
      );
    }
  }
  update(mission: Mission): void {
    throw new MissionStatusError("Une mission finie ne peut pas être modifié.");
  }
  publish(mission: Mission): void {
    throw new MissionStatusError("Une mission finie ne peut pas être publiée.");
  }
  cancel(mission: Mission): void {
    throw new MissionStatusError("Une mission finie ne peut pas être annulée.");
  }
  finished(mission: Mission): void {}
  delete(mission: Mission): void {}
  addRegistration(mission: Mission, registration: Registration): void {
    throw new MissionStatusError(
      "Une mission finie ne peut pas avoir d'inscription.",
    );
  }
  removeRegistration(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission finie ne peut pas avoir d'inscription.",
    );
  }
  cancelRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission finie ne peut pas avoir d'inscription.",
    );
  }
  validateRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission finie ne peut pas avoir d'inscription.",
    );
  }
  refuseRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission finie ne peut pas avoir d'inscription.",
    );
  }
}
