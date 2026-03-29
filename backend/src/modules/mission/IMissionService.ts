import type { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import type { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import type { Mission } from "./MissionModel.js";
import type { SearchMission } from "./payload/SearchMission.js";

export interface IMissionService {
  createMission(missionDTO: CreateMissionDTO): Promise<Mission>;
  cancelMission(missionUuid: string, requesterUuid: string, roleID: number): Promise<void>;
  getMission(missionUuid: string): Promise<Mission>;
  getMissions(filters: SearchMissionDTO): Promise<Mission[]>;
}
