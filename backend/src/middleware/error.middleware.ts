import type { Request, Response, NextFunction } from "express";
import { HttpException } from "../utils/HttpException.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(`[ERROR] ${req.method} ${req.url} >> ${err.message}`);
  console.error(err.stack);


  const status = err instanceof HttpException ? err.status : 500;
  const message =
    err instanceof HttpException ? err.message : "Erreur interne du serveur";

  res.status(status).json({
    success: false,
    status: status,
    message: message,
  });
};
