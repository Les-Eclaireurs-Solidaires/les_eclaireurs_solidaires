import type { Registration } from "../../registration/Registration.js";
import { MissionStatusError } from "../exceptions/MissionStatusError.js";
import type { Mission } from "../Mission.js";
import { MissionState } from "../MissionState.js";
import { MissionStatus } from "../MissionStatusEnum.js";

export class CancelledState extends MissionState {
  validate(mission: Mission): void {}

  update(mission: Mission): void {
    throw new MissionStatusError("Une mission annulée peut pas être modifié.");
  }
  publish(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas être publiée.",
    );
  }
  cancel(mission: Mission): void {}
  finished(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas être terminée.",
    );
  }
  delete(mission: Mission): void {}
  addRegistration(mission: Mission, registration: Registration): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription.",
    );
  }
  removeRegistration(mission: Mission): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription.",
    );
  }
  cancelRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription.",
    );
  }
  validateRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription.",
    );
  }
  refuseRegistration(mission: Mission, targetUuid: string): void {
    throw new MissionStatusError(
      "Une mission annulée ne peut pas avoir d'inscription.",
    );
  }
}
