import type { NextFunction, Request, Response } from "express";
import { HttpException } from "../utils/AppException.js";
import type { UserRole } from "../modules/user/userRole.enum.js";

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.roleId;
      roles.includes(role) ? next() : next(new HttpException(403, "Forbidden"));
    } catch (error) {
      next(error);
    }
  };
};
