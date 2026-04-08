import { DomainError } from "../../DomainError.js";
export class EmailAlreadyExistError extends DomainError {
  constructor(email: string) {
    super(`L'email ${email} est déjà utilisé.`);
    this.name = "EmailAlreadyExistError";
    Object.setPrototypeOf(this, EmailAlreadyExistError.prototype);
  }
}
