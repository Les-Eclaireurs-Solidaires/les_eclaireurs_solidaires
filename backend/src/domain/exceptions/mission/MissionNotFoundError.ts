import { DomainError } from "../DomainError.js";

export class MissionNotFoundError extends DomainError {
  constructor() {
    super("La mission n'existe pas.");
  }
}
