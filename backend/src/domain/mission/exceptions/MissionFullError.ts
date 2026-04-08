import { DomainError } from "../../DomainError.js";


export class MissionFullError extends DomainError {
  constructor(missionName: string) {
    super(
      `Impossible de s'inscrire, la mission : "${missionName}" est complète.`,
    );
    this.name = "MissionFullError";
    Object.setPrototypeOf(this, MissionFullError.prototype);
  }
}
