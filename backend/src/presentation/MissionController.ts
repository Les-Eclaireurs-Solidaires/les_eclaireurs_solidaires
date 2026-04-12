import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { requireAuth } from "../infra/web/middlewares/AuthMiddleware.js";
import { requireRole } from "../infra/web/middlewares/RoleMiddleware.js";
import { UserRole } from "../domain/user/UserRoleEnum.js";
import type { ITokenService } from "../domain/authentication/interfaces/ITokenService.js";
import {
  validateBody,
  validateQuery,
} from "../infra/web/middlewares/ValidateDtoMiddleware.js";
import { CreateMissionDTO } from "./dto/mission/CreateMissionDTO.js";
import type { IActor } from "../domain/user/IActor.js";
import { UnauthenticatedError } from "../infra/exceptions/UnauthenticatedError.js";
import type { IMissionService } from "../domain/mission/interfaces/IMissionService.js";
import { UpdateMissionOrganizersDTO } from "./dto/mission/UpdateMissionOrganizersDTO.js";
import { UpdateMissionDetailsDTO } from "./dto/mission/UpdateMissionDetailsDTO.js";
import type { Mission } from "../domain/mission/Mission.js";
import { FiltersInputDTO } from "./dto/mission/FiltersInputDTO.js";

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
  private getActor(req: Request): IActor {
    if (!req.user) {
      throw new UnauthenticatedError();
    }

    return {
      getUuid: () => req.user!.uuid,
      getRole: () => req.user!.roleId,
    };
  }
  private initializeRoutes(): void {
    this.missionRouter.post(
      "/createMission",
      requireAuth(this.tokenService),
      requireRole([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
      validateBody(CreateMissionDTO),
      this.createMission,
    );
    this.missionRouter.get("/:uuid", this.getMissionDetail);

    this.missionRouter.get(
      "/",
      validateQuery(FiltersInputDTO),
      this.getMissions,
    );
    this.missionRouter.patch(
      "/:uuid",
      requireAuth(this.tokenService),
      requireRole([
        UserRole.VOLUNTEER,
        UserRole.ORGANIZER,
        UserRole.SUPER_ADMIN,
      ]),
      validateBody(UpdateMissionDetailsDTO),
      this.updateDetails,
    );
    this.missionRouter.patch(
      "/:uuid/organizers",
      requireAuth(this.tokenService),
      requireRole([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
      validateBody(UpdateMissionOrganizersDTO),
      this.updateOrganizers,
    );
    /* this.missionRouter.patch(
      "/:uuid/cancel",
      requireAuth(this.tokenService),
      requireRole([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
      this.cancelMission,
    );
    this.missionRouter.patch(
      "/:uuid/finish",
      requireAuth(this.tokenService),
      requireRole([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
      this.finishMission,
    ); */
  }
  private updateDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const updateMissionDetailsDto: UpdateMissionDetailsDTO =
      res.locals.validateBody;
    const missionUuid = req.params.uuid as string;

    const result = await this.missionService.updateMissionDetails(
      updateMissionDetailsDto,
      missionUuid,
      this.getActor(req),
    );

    return res.status(200).json({
      mission: result.toDashboard(),
    });
  };
  private updateOrganizers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const updateMissionOrganizersDto: UpdateMissionOrganizersDTO =
      res.locals.validateBody;
    const missionUuid = req.params.uuid as string;

    const result: Mission = await this.missionService.updateMissionOrganizers(
      updateMissionOrganizersDto,
      missionUuid,
      this.getActor(req),
    );

    return res.status(200).json({
      mission: result.toDashboard(),
    });
  };
  private createMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const createMissionDTO: CreateMissionDTO = res.locals.validateBody;

    const actor = this.getActor(req);

    const result = await this.missionService.createMission(
      createMissionDTO,
      actor,
    );

    return res.status(201).json({
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
      mission: mission.toDetail(),
    });
  };
  private getMissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const filters: FiltersInputDTO = res.locals.validateQuery;

    const missions = await this.missionService.getMissions(filters);

    return res.status(200).json({
      missions: missions.map((mission) => mission.toSummary()),
      meta: {
        total: missions.length,
      },
    });
  };
}
