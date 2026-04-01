import type { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import type { Mission } from "./MissionModel.js";

export interface IMissionService {
  createMission(missionDTO: CreateMissionDTO): Promise<Mission>;
}
