import { DomainError } from "../../DomainError.js";

export class MissionNotActiveError extends DomainError {
  constructor() {
    super("La mission n'est pas ouverte aux inscriptions.");
    this.name = "MissionNotActiveError";
    Object.setPrototypeOf(this, MissionNotActiveError.prototype);
  }
}
