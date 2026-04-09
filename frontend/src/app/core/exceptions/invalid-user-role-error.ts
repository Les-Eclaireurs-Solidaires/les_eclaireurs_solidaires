export class InvalidUserRoleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserRoleError';

    //Securite lors d'heritage de classe native comme Error 
    Object.setPrototypeOf(this, InvalidUserRoleError.prototype);
  }
}
