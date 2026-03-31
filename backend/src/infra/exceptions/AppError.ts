export abstract class AppError extends Error{
    constructor(message: string) {
    super(message);
    this.name = this.constructor.name; 
    Error.captureStackTrace(this, this.constructor);
    
    //Securite lors d'heritage de classe native comme Error 
    Object.setPrototypeOf(this, AppError.prototype);
  }
}