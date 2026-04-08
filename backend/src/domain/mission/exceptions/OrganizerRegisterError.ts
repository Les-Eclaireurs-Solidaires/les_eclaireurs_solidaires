import { DomainError } from "../../DomainError.js";


export class OrganizerRegisterError extends DomainError {
  constructor() {
    super("Impossible de s'inscrire à une mission que l'on organise.");
    this.name = "OrganizerRegisterError";
    Object.setPrototypeOf(this, OrganizerRegisterError.prototype);
  }
}
