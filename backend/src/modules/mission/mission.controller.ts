import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { IMissionService } from "./missionService.interface.js";
import { validateDto } from "../../middleware/validateDto.middleware.js";
import { CreateMissionDto } from "../auth/dtos/createMission.dto.js";
import { UserRole } from "../user/userRole.enum.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

export class MissionController {
  private missionRouter: Router = Router();

  constructor(private missionService: IMissionService) {
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.missionRouter;
  }

  private initializeRoutes(): void {
    this.missionRouter.post(
      "/createMission",
      requireAuth,
      requireRole([UserRole.ORGANISATEUR, UserRole.SUPER_ADMIN]),
      validateDto(CreateMissionDto),
      this.createMission,
    );
  }

  private createMission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const createMissionDto: CreateMissionDto = req.body;

    const result = await this.missionService.createMission(createMissionDto);

    return res
      .status(200)
      .json({ message: "Mission created successfully", mission: result });
  };
}
