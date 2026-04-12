import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { IActor } from "../domain/user/IActor.js";
import { requireAuth } from "../infra/web/middlewares/AuthMiddleware.js";
import type { ITokenService } from "../domain/authentication/interfaces/ITokenService.js";
import { requireRole } from "../infra/web/middlewares/RoleMiddleware.js";
import { UserRole } from "../domain/user/UserRoleEnum.js";
import { UnauthorizedError } from "../infra/exceptions/UnauthorizedError.js";
import { validateQuery } from "../infra/web/middlewares/ValidateDtoMiddleware.js";
import { FiltersInputDTO } from "./dto/mission/FiltersInputDTO.js";
import type { IMissionService } from "../domain/mission/interfaces/IMissionService.js";

export class UserController {
  private userRouter: Router = Router();

  constructor(private missionService: IMissionService,private tokenService: ITokenService) {
    this.initializeRoutes();
  }
  public getRouter(): Router {
    return this.userRouter;
  }
  private initializeRoutes(): void {
    this.userRouter.get(
      "/dashboard",
      requireAuth(this.tokenService),
      validateQuery(FiltersInputDTO),
      requireRole([
        UserRole.VOLUNTEER,
        UserRole.ORGANIZER,
        UserRole.SUPER_ADMIN,
      ]),
      this.getDashboardMission,
    );
  }
  private getDashboardMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const actor: IActor = {
      getUuid: () => req.user!.uuid,
      getRole: () => req.user!.roleId,
    };

    const filters: FiltersInputDTO = res.locals.validateQuery;

    const dashboardData = await this.missionService.getDashboardMission(filters,actor);

    return res.status(200).json(dashboardData);
  };
}
