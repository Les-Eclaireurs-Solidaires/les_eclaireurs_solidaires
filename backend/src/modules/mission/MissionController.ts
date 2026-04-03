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
import type { ITokenService } from "../auth/ITokenService.js";
import {
  validateBody,
  validateQuery,
} from "../../infra/web/middlewares/ValidateDtoMiddleware.js";
import { UpdateMissionDTO } from "./dtos/UpdateMissionDTO.js";
import { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";

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
      "/",
      requireAuth(this.tokenService),
      requireRole([UserRole.ORGANISATEUR, UserRole.SUPER_ADMIN]),
      validateBody(CreateMissionDTO),
      this.createMission,
    );
    this.missionRouter.patch(
      "/:uuid",
      requireAuth(this.tokenService),
      requireRole([
        UserRole.BENEVOLE,
        UserRole.ORGANISATEUR,
        UserRole.SUPER_ADMIN,
      ]),
      validateBody(UpdateMissionDTO),
      this.updateMission,
    );
    this.missionRouter.get("/:uuid", this.getMissionDetail);

    this.missionRouter.get(
      "/",
      validateQuery(SearchMissionDTO),
      this.getMissions,
    );
  }

  private createMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const createMissionDTO: CreateMissionDTO = res.locals.validateBody;

    const result = await this.missionService.createMission(createMissionDTO);

    return res.status(201).json({
      message: "Mission created successfully",
      mission: result.toDetail(),
    });
  };

  private updateMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const updateMissionDto: UpdateMissionDTO = res.locals.validateBody;
    const missionUuid = req.params.uuid as string;

    const result = await this.missionService.updateMission(
      updateMissionDto,
      missionUuid,
    );

    return res.status(200).json({
      message: "Mission updated successfully",
      mission: result.toDetail(),
    });
  };

  private getMissionDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const missionUuid: string = req.params.uuid as string;

    const mission = await this.missionService.getMissionDetail(missionUuid);

    return res.status(200).json({
      message: "Mission fetched successfully",
      mission: mission,
    });
  };

  private getMissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const filters: SearchMissionDTO = res.locals.validateQuery;

    const missions = await this.missionService.getMissions(filters);

    return res.status(200).json({
      message: "Missions fetched successfully",
      missions: missions.map((mission) => mission.toSummary()),
    });
  };
}
