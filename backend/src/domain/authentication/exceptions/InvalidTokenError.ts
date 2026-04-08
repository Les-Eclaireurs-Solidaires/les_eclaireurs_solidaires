import { DomainError } from "../../DomainError.js";
export class InvalidTokenError extends DomainError {
  constructor() {
    super("Token manquant, expiré ou invalide.");
    this.name = "EmailAlreadyExistError";
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}
