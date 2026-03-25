import type { NextFunction, Request, Response } from "express";
import type { TokenService } from "../../security/TokenService.js";
import { UnauthenticatedError } from "../../exceptions/UnauthenticatedError.js";

export const requireAuth = (tokenService: TokenService) => {
return (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new UnauthenticatedError();
    }

    const payload = tokenService.verifyAccessToken(token);

    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
  }
};
