import { DomainError } from "../DomainError.js";

export class MissionVolunteerNotRegisteredError extends DomainError {
  constructor(userUuid: string) {
    super(`L'utilisateur ${userUuid} n'est pas inscrit à cette mission.`);
    Object.setPrototypeOf(this, MissionVolunteerNotRegisteredError.prototype);
  }
}
