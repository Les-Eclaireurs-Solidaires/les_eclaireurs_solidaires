import type { IMission } from "../../../modules/mission/IMissionModel.js";
import { Mission } from "../../../modules/mission/Mission.js";
import { MissionStatus } from "../../../modules/mission/MissionStatusEnum.js";
import type { Registration } from "../../../modules/registration/RegistrationModel.js";
import { MissionStatusError } from "../../exceptions/mission/MissionStatusError.js";
import { CancelledState } from "./CancelledState.js";
import { MissionState } from "./MissionState.js";
import { PublishedState } from "./PublishedState.js";

export class DraftState extends MissionState {
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
    if (!mission.getName() || mission.getName().trim() === "") {
      throw new MissionStatusError("Un brouillon doit au moins avoir un nom.");
    }
    const mains = mission
      .getOrganizers()
      .filter((organizer) => organizer.isMain);
    if (mains.length !== 1) {
      throw new MissionStatusError(
        "Un brouillon doit avoir exactement un organisateur principal.",
      );
    }
  }
  update(mission: Mission): void {
    this.validate(mission);
  }
  publish(mission: Mission): void {
    mission.setState(new PublishedState());
    mission.getState().validate(mission);
    mission.setStatus(MissionStatus.PUBLISHED);
  }
  cancel(mission: Mission): void {
    mission.setState(new CancelledState());
    mission.setStatus(MissionStatus.CANCELED);
  }
  finished(mission: Mission): void {
    throw new MissionStatusError("Un brouillon ne peut pas être terminé.");
  }
  delete(mission: Mission): void {
    //HARD DELETE
  }
  addRegistration(mission: Mission, registration: Registration): void {
    throw new MissionStatusError(
      "Un brouillon ne peut pas avoir d'inscription.",
    );
  }
  removeRegistration(mission: Mission): void {
    if (!mission.getRegistrations()) {
      return;
    }
  }
}
