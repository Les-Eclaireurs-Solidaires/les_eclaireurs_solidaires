import { AppError } from "./AppError.js";

export class EmptyUpdateError extends AppError {
  constructor() {
    super(`Aucune donnée fournie pour la mise à jour en base de données.`);
  }
}
