import { DomainError } from "../../DomainError.js";

export class RegistrationStatusError extends DomainError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, RegistrationStatusError.prototype);
  }
}
