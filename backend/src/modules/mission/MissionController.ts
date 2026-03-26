import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { IMissionService } from "./IMissionService.js";
import { requireAuth } from "../../infra/web/middlewares/AuthMiddleware.js";
import { requireRole } from "../../infra/web/middlewares/RoleMiddleware.js";
import { UserRole } from "../user/UserRoleEnum.js";
import { validateDto } from "../../infra/web/middlewares/ValidateDtoMiddleware.js";
import { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import type { ITokenService } from "../auth/ITokenService.js";
import { BadRequestError } from "../../infra/exceptions/BadRequestError.js";

export class MissionController {
  private missionRouter: Router = Router();

  constructor(
    private missionService: IMissionService,
    private tokenService: ITokenService,
  ) {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.missionRouter;
  }

  private initializeRoutes(): void {
    this.missionRouter.post(
      "/createMission",
      requireAuth(this.tokenService),
      requireRole([UserRole.ORGANISATEUR, UserRole.SUPER_ADMIN]),
      validateDto(CreateMissionDTO),
      this.createMission,
    );
    this.missionRouter.delete(
      "/cancelMission/:missionUuid",
      requireAuth(this.tokenService),
      requireRole([
        UserRole.BENEVOLE,
        UserRole.ORGANISATEUR,
        UserRole.SUPER_ADMIN,
      ]),
      this.cancelMission,
    );
  }

  private createMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const createMissionDto: CreateMissionDTO = req.body;

    const result = await this.missionService.createMission(createMissionDto);

    return res
      .status(201)
      .json({ message: "Mission created successfully", mission: result });
  };

  private cancelMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const missionUuid = req.params.missionUuid as string;
    const requesterUuid = req.user!.uuid;
    const roleID = req.user!.roleId;


    if (!missionUuid || !requesterUuid || !roleID) {
      throw new BadRequestError("Le paramètre voulu n'a pas été trouvé.");
    }

    await this.missionService.cancelMission(missionUuid, requesterUuid, roleID);

    return res
      .status(200)
      .json({ message: "Mission canceled successfully" });
  };
}
