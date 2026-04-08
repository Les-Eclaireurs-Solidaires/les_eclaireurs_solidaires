import { DomainError } from "../../DomainError.js";


export class UnauthorizedCancelMissionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedCancelMissionError";
    Object.setPrototypeOf(this, UnauthorizedCancelMissionError.prototype);
  }
}
