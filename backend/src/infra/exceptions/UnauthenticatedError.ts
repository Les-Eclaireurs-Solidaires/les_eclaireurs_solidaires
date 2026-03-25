import { AppError } from "./AppError.js";

export class UnauthenticatedError extends AppError {
  constructor() {
    super("Token manquant, expiré ou invalide.");
  }
}
