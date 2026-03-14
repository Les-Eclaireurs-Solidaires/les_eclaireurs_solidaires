import type { CreateMissionDto } from "../auth/dtos/createMission.dto.js";
import type { IMission } from "./mission.interface.js";
import type { Mission } from "./mission.model.js";

export interface IMissionService {
  createMission(missionDTO: CreateMissionDto): Promise<Mission>;
}
