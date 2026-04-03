import { DomainError } from "../DomainError.js";

export class RegistrationNotFoundError extends DomainError {
  constructor(message?: string) {
    if (message) {
      super(message);
    } else {
      super("Inscription non trouvée.");
    }
    Object.setPrototypeOf(this, RegistrationNotFoundError.prototype);
  }
}
