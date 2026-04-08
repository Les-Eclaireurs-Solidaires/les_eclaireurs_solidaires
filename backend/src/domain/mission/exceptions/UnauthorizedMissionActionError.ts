import { DomainError } from "../../DomainError.js";


export class UnauthorizedMissionActionError extends DomainError {
  constructor() {
    super("L'utilisateur n'est pas autorisé à effectuer cette action.");
    this.name = "UnauthorizedMissionActionError";
    Object.setPrototypeOf(this, UnauthorizedMissionActionError.prototype);
  }
}
