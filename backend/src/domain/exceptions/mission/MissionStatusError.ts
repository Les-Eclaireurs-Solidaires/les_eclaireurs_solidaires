import { DomainError } from "../DomainError.js";

export class MissionStatusError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
