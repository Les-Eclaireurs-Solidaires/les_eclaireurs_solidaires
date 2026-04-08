import type { Registration } from "../../registration/Registration.js";
import { MissionStatusError } from "../exceptions/MissionStatusError.js";
import { Mission } from "../Mission.js";
import { MissionState } from "../MissionState.js";
import { MissionStatus } from "../MissionStatusEnum.js";
import { DraftState } from "./DraftState.js";

export class CancelledState extends MissionState {
  revertToDraft(mission: Mission): void {
    mission.setState(new DraftState());
    mission.setStatus(MissionStatus.DRAFT);
  }
  validate(mission: Mission): void {}
  updateDetails(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas être mise à jour directement.",
    );
  }
  updateOrganizers(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas être mise à jour directement.",
    );
  }
  publish(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas être re-publiée directement.",
    );
  }
  cancel(mission: Mission): void {}
  finished(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas être terminée.",
    );
  }
  delete(mission: Mission): void {}
  subscribe(mission: Mission, registration: Registration): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir de nouvelle inscription.",
    );
  }
  removeRegistration(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir de liste d'inscription.",
    );
  }
  cancelRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription à annuler.",
    );
  }
  validateRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription à valider.",
    );
  }
  refuseRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription à refuser.",
    );
  }
}
