import { DomainError } from "../../DomainError.js";

export class VolunteerRegisterAlreadyExistError extends DomainError {
  constructor(userUuid: string) {
    super(`L'utilisateur ${userUuid} est déjà inscrit à cette mission.`);
    this.name = "VolunteerRegisterAlreadyExistError";
    Object.setPrototypeOf(this, VolunteerRegisterAlreadyExistError.prototype);
  }
}
