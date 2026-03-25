import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
  constructor() {
    super("Accès non autorisé.");
  }
}
