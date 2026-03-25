import { DomainError } from "../DomainError.js";

export class MissionNameAlreadyExistError extends DomainError {
  constructor(name: string) {
    super(`La mission ${name} existe déjà.`);
  }
}
