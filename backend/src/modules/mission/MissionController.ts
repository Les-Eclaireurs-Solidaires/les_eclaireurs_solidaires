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
import {
  validateBody,
} from "../../infra/web/middlewares/ValidateDtoMiddleware.js";

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
}
