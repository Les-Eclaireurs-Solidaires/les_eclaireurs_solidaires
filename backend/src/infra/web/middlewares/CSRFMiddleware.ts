import type { NextFunction, Request, Response } from "express";
import { CSRFError } from "../../exceptions/CSRFError.js";

const EXCLUDED_METHODS = ["GET", "HEAD", "OPTIONS"];

// Liste des routes à exclure de la protection CSRF
const EXCLUDED_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh"];

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (EXCLUDED_METHODS.includes(req.method) || EXCLUDED_ROUTES.includes(req.path)) {
    return next();
  }

  const csrfTokenFromCookie = req.cookies["XSRF-TOKEN"];
  const csrfTokenFromHeader = req.headers["x-xsrf-token"];

  if (!csrfTokenFromCookie || !csrfTokenFromHeader) {
    return next(new CSRFError("Jeton CSRF manquant (cookie ou header)."));
  }

  if (csrfTokenFromCookie !== csrfTokenFromHeader) {
    return next(new CSRFError("Les jetons CSRF ne correspondent pas."));
  }

  next();
};