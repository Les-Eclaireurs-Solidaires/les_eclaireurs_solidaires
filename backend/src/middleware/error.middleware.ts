import type { Request, Response, NextFunction } from "express";
import {
  AppException,
  BusinessException,
  DtoValidationException,
  HttpException,
  NotFoundException,
} from "../utils/AppException.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(
    `[ERROR] ${req.method} ${req.url} >> ${err.name}: ${err.message}`,
  );
  console.error(err.stack);

  if (err instanceof AppException) {
    if (err instanceof HttpException) {
      return res.status(err.status).json({ message: err.message });
    }

    if (err instanceof BusinessException) {
      return res.status(400).json({ message: err.message });
    }

    if (err instanceof NotFoundException) {
      return res.status(404).json({ message: err.message });
    }

    if(err instanceof DtoValidationException){
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
  }

  return res.status(500).json({ message: "Une erreur interne est survenue." });
};
