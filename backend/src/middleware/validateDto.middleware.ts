import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { Request, Response, NextFunction } from "express";
import { DtoValidationException } from "../utils/AppException.js";

export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      throw new DtoValidationException(
        errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      );
    }
    req.body = dtoInstance;
    next();
  };
}
