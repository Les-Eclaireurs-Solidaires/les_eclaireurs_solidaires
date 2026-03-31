import { DomainError } from "../DomainError.js";

export class UserNotFoundError extends DomainError {
  constructor() {
    super("Utilisateur introuvable");
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}
