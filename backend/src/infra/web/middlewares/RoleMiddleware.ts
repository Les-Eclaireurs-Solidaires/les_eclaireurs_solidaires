import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../../modules/user/UserRoleEnum.js";
import { UnauthorizedError } from "../../exceptions/UnauthorizedError.js";

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.roleId;
      roles.includes(role) ? next() : next(new UnauthorizedError());
    } catch (error) {
      next(error);
    }
  };
};
