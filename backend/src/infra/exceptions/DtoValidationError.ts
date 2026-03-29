import { AppError } from "./AppError.js";

export class DtoValidationError extends AppError {
  public errors: {
          property: string,
          constraints: string,
        }[];

  constructor(errors: any[]) {
    super("Validation failed");
    this.errors = errors;
  }
}
