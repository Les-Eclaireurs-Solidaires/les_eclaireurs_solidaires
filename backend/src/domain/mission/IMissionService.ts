import type { CreateMissionDTO } from "../../presentation/dto/mission/CreateMissionDTO.js";
import type { SearchMissionDTO } from "../../presentation/dto/mission/SearchMissionDTO.js";
import type { UpdateMissionDTO } from "../../presentation/dto/mission/UpdateMissionDTO.js";
import type { Mission } from "./Mission.js";

export interface IMissionService {
  createMission(missionToCreateDTO: CreateMissionDTO): Promise<Mission>;
  updateMission(missionDTO: UpdateMissionDTO, missionUuid: string): Promise<Mission>;
  publishMission(missionUuid: string): Promise<void>;
  cancelMission(missionUuid: string): Promise<void>;
  deleteMission(missionUuid: string): Promise<void>;
  finishMission(missionUuid: string, presentUuids: string[]): Promise<void>;
  registerVolunteer(missionUuid: string, volunteerUuid: string): Promise<void>;
  getMissions(filters: SearchMissionDTO): Promise<Mission[]>;
  getMissionDetail(missionUuid: string): Promise<Mission>;

}
