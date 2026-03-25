import { AppError } from "./AppError.js";

export class DtoValidationError extends AppError {
  public errors: any[];

  constructor(errors: any[]) {
    super("Validation failed");
    this.errors = errors;
  }
}
