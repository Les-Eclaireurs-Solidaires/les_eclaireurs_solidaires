import type { UpdateMissionDetailsDTO } from "../../../presentation/dto/mission/UpdateMissionDetailsDTO.js";
import type { UpdateMissionOrganizersDTO } from "../../../presentation/dto/mission/UpdateMissionOrganizersDTO.js";
import type { Registration } from "../../registration/Registration.js";
import { MissionHardDeleteEvent } from "../event/MissionHardDeleteEvent.js";
import { MissionDateError } from "../exceptions/MissionDateError.js";
import { MissionStatusError } from "../exceptions/MissionStatusError.js";
import { Mission } from "../Mission.js";
import { MissionState } from "../MissionState.js";
import { MissionStatus } from "../MissionStatusEnum.js";
import { PublishedState } from "./PublishedState.js";

export class DraftState extends MissionState {
  revertToDraft(mission: Mission): void {
    throw new MissionStatusError(
      "Impossible de faire d'un brouillon une mission déjà en brouillon.",
    );
  }
  validate(mission: Mission): void {
    this.validateRealityInvariant(mission);
    this.validateBusinessInvariant(mission);
    if (
      mission.getDateStart() &&
      mission.getDateStart().getTime() < new Date().getTime()
    ) {
      throw new MissionDateError("Date de début doit être dans le futur.");
    }
  }
  updateDetails(mission: Mission, dto: UpdateMissionDetailsDTO): void {}
  updateOrganizers(mission: Mission, dto: UpdateMissionOrganizersDTO): void {}
  publish(mission: Mission): void {
    mission.setState(new PublishedState());
    mission.setStatus(MissionStatus.PUBLISHED);
    mission.getState().validate(mission);
  }
  cancel(mission: Mission): void {
    throw new MissionStatusError(
      "Un brouillon ne peut pas être annulé, il doit être supprimé.",
    );
  }
  finished(mission: Mission): void {
    throw new MissionStatusError("Un brouillon ne peut pas être terminé.");
  }
  delete(mission: Mission): void {
    mission.addEvent(new MissionHardDeleteEvent(mission.getUuid()));
  }
  subscribe(mission: Mission, registration: Registration): void {
    throw new MissionStatusError(
      "Impossible d'ajouter une inscription à un brouillon",
    );
  }
  removeRegistration(mission: Mission): void {
    throw new MissionStatusError(
      "Impossible d'enlever une inscription à un brouillon",
    );
  }
  cancelRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Impossible d'annuler une inscription à un brouillon",
    );
  }
  validateRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Impossible de valider une inscription à un brouillon",
    );
  }
  refuseRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Impossible de refuser une inscription à un brouillon",
    );
  }
}
