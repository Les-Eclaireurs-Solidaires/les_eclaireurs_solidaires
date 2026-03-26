import { DomainError } from "../DomainError.js";

export class UnauthorizedCancelMissionError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
