import { DomainError } from "../../DomainError.js";
export class GeolocalizationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "GeolocalizationError";
    Object.setPrototypeOf(this, GeolocalizationError.prototype);
  }
}
