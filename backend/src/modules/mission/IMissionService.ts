import type { CreateMissionDTO } from "./dtos/CreateMissionDTO.js";
import type { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import type { UpdateMissionDTO } from "./dtos/UpdateMissionDTO.js";
import type { Mission } from "./MissionModel.js";

export interface IMissionService {
  createMission(missionDTO: CreateMissionDTO): Promise<Mission>;
  updateMission(missionDTO: UpdateMissionDTO,missionUuid: string): Promise<Mission>;
  getMissionDetail(missionUuid: string): Promise<Mission>;
  getMissions(filters: SearchMissionDTO): Promise<Mission[]>;
}
