import { AppError } from "./AppError.js";

export class CSRFError extends AppError {
  constructor() {
    super("Jeton CSRF invalide ou manquant");
    Object.setPrototypeOf(this, CSRFError.prototype);
  }
}
