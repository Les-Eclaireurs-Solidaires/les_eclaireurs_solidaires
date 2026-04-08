import { DomainError } from "../../DomainError.js";

export class MissionDateError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "MissionDateError";
    Object.setPrototypeOf(this, MissionDateError.prototype);
  }
}
