import type { Mission } from "../../../modules/mission/Mission.js";
import type { Registration } from "../../../modules/registration/RegistrationModel.js";
import { MissionState } from "./MissionState.js";

export class CancelledState extends MissionState {
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
    throw new Error("Method not implemented.");
  }
  update(mission: Mission): void {
    throw new Error("Method not implemented.");
  }
  publish(mission: Mission): void {
    throw new Error("Method not implemented.");
  }
  cancel(mission: Mission): void {
    throw new Error("Method not implemented.");
  }
  finished(mission: Mission): void {
    throw new Error("Method not implemented.");
  }
  delete(mission: Mission): void {
    throw new Error("Method not implemented.");
  }
  addRegistration(mission: Mission, registration: Registration): void {
    throw new Error("Method not implemented.");
  }
  removeRegistration(mission: Mission): void {
    throw new Error("Method not implemented.");
  }
}
