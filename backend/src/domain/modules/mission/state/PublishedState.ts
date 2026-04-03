import type { Mission } from "../../../modules/mission/Mission.js";
import { MissionStatus } from "../../../modules/mission/MissionStatusEnum.js";
import type { Registration } from "../../../modules/registration/RegistrationModel.js";
import { RegistrationStatus } from "../../../modules/registration/RegistrationStatusEnum.js";
import { MissionFullError } from "../../exceptions/mission/MissionFullError.js";
import { MissionNotActiveError } from "../../exceptions/mission/MissionNotActiveError.js";
import { MissionNotFoundError } from "../../exceptions/mission/MissionNotFoundError.js";
import { MissionStatusError } from "../../exceptions/mission/MissionStatusError.js";
import { RegistrationStatusError } from "../../exceptions/registration/RegistrationStatusError.js";
import { CancelledState } from "./CancelledState.js";
import { FinishedState } from "./FinishedState.js";
import { MissionState } from "./MissionState.js";

export class PublishedState extends MissionState {
  cancelRegistration(mission: Mission, targetUuid: string): void {
    throw new Error("Method not implemented.");
  }
  validateRegistration(mission: Mission, targetUuid: string): void {
    throw new Error("Method not implemented.");
  }
  refuseRegistration(mission: Mission, targetUuid: string): void {
    throw new Error("Method not implemented.");
  }
  validate(mission: Mission): void {
    this.validateBasicInfo(mission);
    this.validateLocalisation(mission);
    this.validateDateCoherence(mission);
    this.validateOrganizerValid(mission);
    this.validateCategoryValid(mission);

    if (
      !this.hasAvailablePlaces(mission) ||
      mission.getNbrVolunteerNeeded() === 0
    ) {
      throw new MissionStatusError(
        "Une mission publiée doit avoir des places disponibles.",
      );
    }
  }
  update(mission: Mission): void {
    this.validate(mission);
  }
  publish(mission: Mission): void {
    throw new MissionStatusError(
      "Impossible de publier une mission déjà publiée.",
    );
  }
  cancel(mission: Mission): void {    
    mission.setState(new CancelledState());
    mission.setStatus(MissionStatus.CANCELED);
  }
  finished(mission: Mission): void {
    if (mission.getRegistrations().length === 0)
      throw new MissionStatusError(
        "Impossible de terminer une mission sans inscription.",
      );  

    mission.setState(new FinishedState());
    mission.setStatus(MissionStatus.FINISHED);
  }
  delete(mission: Mission): void {
    if (mission.getRegistrations().length > 0) {
      // NO THROW ERROR IN PROD WE WANT TO COMMUNICATE WITH USER REGISTERED
      throw new MissionStatusError(
        "Impossible de supprimer une mission qui a des inscription en cours.",
      );
    }
    mission.setState(new CancelledState());
    mission.setStatus(MissionStatus.CANCELED);
  }
  addRegistration(mission: Mission, registration: Registration): void {
    if (!this.hasAvailablePlaces(mission)) {
      throw new MissionFullError(
        "Impossible d'ajouter une inscription à une mission qui est pleine.",
      );
    }
    if (registration.getStatus() !== RegistrationStatus.ONHOLD)
      throw new RegistrationStatusError(
        "Impossible d'ajouter une inscription qui n'est pas en attente.",
      );

    if (registration.getMissionUuid() !== mission.getUuid()) {
      throw new MissionNotFoundError();
    }
    if (!this.isRegistrationOpen(mission)) {
      throw new MissionNotActiveError();
    }
    mission.executeRegistration(registration);
  }
  removeRegistration(mission: Mission): void {}

}
