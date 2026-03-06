import type { NextFunction, Request, Response } from "express";
import { HttpException } from "../utils/HttpException.js";
import { TokenUtil } from "../utils/token.util.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new HttpException(401, "Token manquant");
    }

    const payload = TokenUtil.verifyAccessToken(token);

    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};
