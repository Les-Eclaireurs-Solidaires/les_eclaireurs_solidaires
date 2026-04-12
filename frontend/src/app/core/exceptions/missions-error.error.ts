export class MissionsNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionsNotFound';

    //Securite lors d'heritage de classe native comme Error
    Object.setPrototypeOf(this, MissionsNotFoundError.prototype);
  }
}
export class MissionStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionStatus';

    //Securite lors d'heritage de classe native comme Error
    Object.setPrototypeOf(this, MissionStatusError.prototype);
  }
}
export class GeolocalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Geolocalization';

    //Securite lors d'heritage de classe native comme Error
    Object.setPrototypeOf(this, GeolocalizationError.prototype);
  }
}export class MissionDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionDate';

    //Securite lors d'heritage de classe native comme Error
    Object.setPrototypeOf(this, MissionDateError.prototype);
  }
}