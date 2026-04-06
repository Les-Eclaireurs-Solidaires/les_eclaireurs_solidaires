import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { UserRole } from "../domain/user/UserRoleEnum.js";
import { BadRequestError } from "../infra/exceptions/BadRequestError.js";
import { requireAuth } from "../infra/web/middlewares/AuthMiddleware.js";
import { requireRole } from "../infra/web/middlewares/RoleMiddleware.js";
import type { ITokenService } from "../domain/authentication/ITokenService.js";
import type { IMissionService } from "../domain/mission/IMissionService.js";

export class RegistrationController {
  private registrationRouter: Router = Router({ mergeParams: true });

  constructor(
    private missionService: IMissionService,
    private tokenService: ITokenService,
  ) {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.registrationRouter;
  }

  private initializeRoutes(): void {
    this.registrationRouter.post(
      "/registration",
      requireAuth(this.tokenService),
      requireRole([
        UserRole.BENEVOLE,
        UserRole.ORGANISATEUR,
        UserRole.SUPER_ADMIN,
      ]),
      this.registerVolunteer,
    );
  }

  private registerVolunteer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const missionUuid = req.params.missionUuid as string;
    const volunteerUuid = req.user!.uuid;

    if (!missionUuid || !volunteerUuid) {
      throw new BadRequestError("Le paramètre voulu n'a pas été trouvé.");
    }

    await this.missionService.registerVolunteer(
      volunteerUuid,
      missionUuid,
    );

    return res
      .status(201)
      .json({ message: "Registration completed successfully" });
  };
}
