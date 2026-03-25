import type { NextFunction, Request, Response } from "express";
import { CSRFError } from "../../exceptions/CSRFError.js";

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (
      req.method === "GET" ||
      req.method === "HEAD" ||
      req.method === "OPTIONS"
    ) {
      return next();
    }
    const excludedRoutes = ["/auth/login", "/auth/register"];
    if (excludedRoutes.includes(req.path)) {
      return next();
    }
    const csrfToken = req.cookies["XSRF-TOKEN"];
    const frontCsrfToken = req.headers["x-xsrf-token"];
    if (!csrfToken || !frontCsrfToken || csrfToken !== frontCsrfToken) {
      throw new CSRFError();
    }
    next();
  } catch (error) {
    next(error);
  }
};
