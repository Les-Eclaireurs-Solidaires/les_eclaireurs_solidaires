export class MissionsNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionsNotFoundError';

    //Securite lors d'heritage de classe native comme Error
    Object.setPrototypeOf(this, MissionsNotFoundError.prototype);
  }
}
