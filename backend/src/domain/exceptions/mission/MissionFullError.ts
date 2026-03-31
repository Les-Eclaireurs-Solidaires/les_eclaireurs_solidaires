import { DomainError } from "../DomainError.js";

export class MissionFullError extends DomainError {
  constructor(missionName: string) {
    super(
      `Impossible de s'inscrire, la mission : "${missionName}" est complète.`,
    );
    Object.setPrototypeOf(this, MissionFullError.prototype);
  }
}
