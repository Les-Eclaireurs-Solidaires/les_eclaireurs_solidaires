import type { CreateMissionDTO } from "../../presentation/dto/mission/CreateMissionDTO.js";
import type { SearchMissionDTO } from "../../presentation/dto/mission/SearchMissionDTO.js";
import type { UpdateMissionDTO } from "../../presentation/dto/UpdateMissionDTO.js";
import type { Mission } from "./Mission.js";

export interface IMissionService{
  createMission(missionDTO: CreateMissionDTO): Promise<Mission>;
  updateMission(missionDTO: UpdateMissionDTO, missionUuid: string): Promise<Mission>;
  getMissionDetail(missionUuid: string): Promise<Mission | null>;
  getMissions(filters: SearchMissionDTO): Promise<Mission[]>;
  registerVolunteer(missionUuid: string, volunteerUuid: string): Promise<void>;
}