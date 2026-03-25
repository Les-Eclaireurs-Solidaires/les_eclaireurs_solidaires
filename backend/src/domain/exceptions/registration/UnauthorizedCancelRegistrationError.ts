import { DomainError } from "../DomainError.js";

export class UnauthorizedCancelRegistrationError extends DomainError {
  constructor() {
    super("Vous n'êtes pas autorisé à annuler cette inscription.");
  }
}
