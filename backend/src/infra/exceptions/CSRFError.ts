import { AppError } from "./AppError.js";

export class CSRFError extends AppError {
  constructor(message:string ) {
    super(message);
    Object.setPrototypeOf(this, CSRFError.prototype);
  }
}
