import type { UpdateMissionDTO } from "../../../presentation/dto/mission/UpdateMissionDTO.js";
import type { Registration } from "../../registration/Registration.js";
import { MissionDateError } from "../exceptions/MissionDateError.js";
import { MissionStatusError } from "../exceptions/MissionStatusError.js";
import type { Mission } from "../Mission.js";
import { MissionState } from "../MissionState.js";
import { MissionStatus } from "../MissionStatusEnum.js";
import { PublishedState } from "./PublishedState.js";

export class DraftState extends MissionState {
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
  update(mission: Mission, dto: UpdateMissionDTO): void {
    if (dto.organizers !== undefined) {
      mission.synchroOrgaRegistration(dto.organizers);
    }
  }
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
  delete(mission: Mission): void {}
  addRegistration(mission: Mission, registration: Registration): void {}
  removeRegistration(mission: Mission): void {}
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
