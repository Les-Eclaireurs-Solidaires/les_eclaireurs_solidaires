import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { IRegistrationService } from "./IRegistrationService.js";
import { UserRole } from "../user/UserRoleEnum.js";
import { BadRequestError } from "../../infra/exceptions/BadRequestError.js";
import { requireAuth } from "../../infra/web/middlewares/AuthMiddleware.js";
import { requireRole } from "../../infra/web/middlewares/RoleMiddleware.js";
import type { ITokenService } from "../auth/ITokenService.js";
import { UnauthenticatedError } from "../../infra/exceptions/UnauthenticatedError.js";

export class RegistrationController {
  private registrationRouter: Router = Router({ mergeParams: true });

  constructor(
    private regitrationService: IRegistrationService,
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
    this.registrationRouter.delete(
      "/registration/:targetUserUuid",
      requireAuth(this.tokenService),
      requireRole([
        UserRole.BENEVOLE,
        UserRole.ORGANISATEUR,
        UserRole.SUPER_ADMIN,
      ]),
      this.unregisterVolunteer,
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

    await this.regitrationService.registerVolunteer(volunteerUuid, missionUuid);

    return res
      .status(201)
      .json({ message: "Registration completed successfully" });
  };

  private unregisterVolunteer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const missionUuid = req.params.missionUuid as string;
    const targetUserUuid = req.params.targetUserUuid as string;

    if (!req.user) throw new UnauthenticatedError();
    const requesterUuid = req.user!.uuid;

    if (!missionUuid || !targetUserUuid)
      throw new BadRequestError("Le paramètre voulu n'a pas été trouvé.");

    await this.regitrationService.cancelRegistration(
      targetUserUuid,
      requesterUuid,
      missionUuid,
    );

    return res
      .status(200)
      .json({ message: "Registration deleted successfully" });
  };
}
