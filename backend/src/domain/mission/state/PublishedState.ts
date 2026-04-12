import type { UpdateMissionDetailsDTO } from "../../../presentation/dto/mission/UpdateMissionDetailsDTO.js";
import type { UpdateMissionOrganizersDTO } from "../../../presentation/dto/mission/UpdateMissionOrganizersDTO.js";
import { RegistrationNotFoundError } from "../../registration/exceptions/RegistrationNotFoundError.js";
import { RegistrationStatusError } from "../../registration/exceptions/RegistrationStatusError.js";
import type { Registration } from "../../registration/Registration.js";
import { RegistrationStatus } from "../../registration/RegistrationStatusEnum.js";
import type { IActor } from "../../user/IActor.js";
import { MissionDateError } from "../exceptions/MissionDateError.js";
import { MissionFullError } from "../exceptions/MissionFullError.js";
import { MissionNotActiveError } from "../exceptions/MissionNotActiveError.js";
import { MissionNotFoundError } from "../exceptions/MissionNotFoundError.js";
import { MissionStatusError } from "../exceptions/MissionStatusError.js";
import type { Mission } from "../Mission.js";
import { MissionState } from "../MissionState.js";
import { MissionStatus } from "../MissionStatusEnum.js";
import { CancelledState } from "./CancelledState.js";
import { FinishedState } from "./FinishedState.js";

export class PublishedState extends MissionState {
  revertToDraft(mission: Mission): void {
    throw new MissionStatusError(
      "Impossible de revenir en brouillon une mission publiée.",
    );
  }
  validate(mission: Mission): void {
    this.validateRealityInvariant(mission);
    this.validateBusinessInvariant(mission);
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 1);
    if (
      mission.getDateStart() &&
      mission.getDateStart().getTime() < limitDate.getTime()
    ) {
      throw new MissionDateError(
        "La date de début doit commencer au moins dans 1 jour.",
      );
    }
    this.validateBasicInfo(mission);
    this.validateLocalisation(mission);
    this.validateDateCoherence(mission);
    this.validateOrganizerValid(mission);
    this.validateCategoryValid(mission);
    if (mission.getNbrVolunteerNeeded() <= 0) {
      throw new MissionStatusError(
        "Une mission publiée doit demander au moins un bénévole.",
      );
    }
  }
  updateDetails(mission: Mission, dto: UpdateMissionDetailsDTO): void {}
  updateOrganizers(mission: Mission, dto: UpdateMissionOrganizersDTO): void {}
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
    mission.canceledProcess();
  }
  subscribe(mission: Mission, registration: Registration): void {
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
  removeRegistration(mission: Mission, registration: Registration): void {
    if (
      mission.getRegistrations().length === 0 ||
      !mission.getRegistrations().includes(registration)
    )
      throw new RegistrationNotFoundError();
  }
  cancelRegistration(mission: Mission, targetUuid: string): void {
    throw new Error("Method not implemented.");
  }
  validateRegistration(mission: Mission, targetUuid: string): void {
    throw new Error("Method not implemented.");
  }
  refuseRegistration(mission: Mission, targetUuid: string): void {
    throw new Error("Method not implemented.");
  }
}
