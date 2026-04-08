import { DomainError } from "../../DomainError.js";
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Email ou mot de passe incorrect");
    this.name = "EmailAlreadyExistError";
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}
