import { DomainError } from "../DomainError.js";

export class UserNotFoundError extends DomainError {
  constructor() {
    super("Utilisateur introuvable");
  }
}
