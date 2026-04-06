import { DomainError } from "../../DomainError.js";


export class MissionNameAlreadyExistError extends DomainError {
  constructor(missionName: string) {
    super(`La mission ${missionName} existe déjà.`);
    this.name = "MissionNameAlreadyExistError"
    Object.setPrototypeOf(this, MissionNameAlreadyExistError.prototype);
  }
}
