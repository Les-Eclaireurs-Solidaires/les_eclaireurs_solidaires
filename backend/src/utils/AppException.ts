
export abstract class AppException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name; 
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HttpException extends AppException {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class BusinessException extends AppException {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string) {
    super(message);
  }
}

export class DtoValidationException extends AppException {
  public errors: any[];

  constructor(errors: any[]) {
    super("Validation failed");
    this.errors = errors;
  }
}