import { DomainError } from "../DomainError.js";

export class InvalidTokenError extends DomainError {
  constructor() {
    super("Token manquant, expiré ou invalide.");
  }
}
