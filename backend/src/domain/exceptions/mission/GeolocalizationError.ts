import { DomainError } from "../DomainError.js";

export class GeolocalizationError extends DomainError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GeolocalizationError.prototype);
  }
}
