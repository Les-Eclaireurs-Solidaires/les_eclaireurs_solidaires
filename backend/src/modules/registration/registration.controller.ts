import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { IRegistrationService } from "./registrationService.interface.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { UserRole } from "../user/userRole.enum.js";
import { BusinessException, HttpException } from "../../utils/AppException.js";

export class RegistrationController {
  private registrationRouter: Router = Router({ mergeParams: true });

  constructor(private regitrationService: IRegistrationService) {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.registrationRouter;
  }

  private initializeRoutes(): void {
    this.registrationRouter.post(
      "/registration",
      requireAuth,
      requireRole([
        UserRole.BENEVOLE,
        UserRole.ORGANISATEUR,
        UserRole.SUPER_ADMIN,
      ]),
      this.applyToMission,
    );
    this.registrationRouter.delete(
      "/registration/:targetUserUuid",
      requireAuth,
      requireRole([
        UserRole.BENEVOLE,
        UserRole.ORGANISATEUR,
        UserRole.SUPER_ADMIN,
      ]),
      this.unregisterVolunteer,
    );
  }

  private applyToMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const missionUuid = req.params.missionUuid as string;
    const volunteerUuid = req.user!.uuid;

    if (!missionUuid) {
      throw new BusinessException("Le paramètre voulu n'a pas été trouvé.");
    }
    if (!volunteerUuid) {
      throw new BusinessException("L'utilisateur n'a pas été trouvé.");
    }

    await this.regitrationService.applyToMission(volunteerUuid, missionUuid);

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

    if (!req.user) throw new HttpException(401, "Unauthorized");
    const requesterUuid = req.user!.uuid;

    if (!missionUuid)
      throw new BusinessException("Le paramètre voulu n'a pas été trouvé.");

    if (!targetUserUuid)
      throw new BusinessException("Le paramètre voulu n'a pas été trouvé.");

    await this.regitrationService.deleteRegistration(
      targetUserUuid,
      requesterUuid,
      missionUuid,
    );

    return res
      .status(200)
      .json({ message: "Registration deleted successfully" });
  };
}
