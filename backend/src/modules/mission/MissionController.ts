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
import { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import type { ITokenService } from "../auth/ITokenService.js";
import { BadRequestError } from "../../infra/exceptions/BadRequestError.js";
import {
  validateBody,
  validateQuery,
} from "../../infra/web/middlewares/ValidateDtoMiddleware.js";
import { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import type { SearchMission } from "./payload/SearchMission.js";

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
      validateBody(CreateMissionDTO),
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
    this.missionRouter.get(
      "/missions",
      requireAuth(this.tokenService),
      validateQuery(SearchMissionDTO),
      this.getMissions,
    );
    this.missionRouter.get(
      "/mission/:missionUuid",
      requireAuth(this.tokenService),
      this.getMission,
    );
  }

  private createMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const createMissionDto: CreateMissionDTO = res.locals.validateBody;

    const result = await this.missionService.createMission(createMissionDto);

    return res.status(201).json({
      message: "Mission created successfully",
      mission: result.toResponse(),
    });
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

    return res.status(200).json({
      message: "Mission canceled successfully",
    });
  };

  private getMissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const filters: SearchMission = res.locals.validateQuery;

    const missions = await this.missionService.getMissions(filters);
    const missionsResponse = missions.map((mission) => mission.toResponse());

    return res.status(200).json({
      message: "Missions found successfully",
      missions: missionsResponse,
    });
  };

  private getMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const missionUuid = req.params.missionUuid as string;

    if (!missionUuid) {
      new BadRequestError("Le paramètre voulu n'a pas été trouvé.");
    }

    const mission = await this.missionService.getMission(missionUuid);

    return res.status(200).json({
      message: "Mission found successfully",
      mission: mission.toResponse(),
    });
  };
}
