import type { CreateMissionDTO } from "../../../presentation/dto/mission/CreateMissionDTO.js";
import type { SearchMissionDTO } from "../../../presentation/dto/mission/SearchMissionDTO.js";
import type { UpdateMissionDetailsDTO } from "../../../presentation/dto/mission/UpdateMissionDetailsDTO.js";
import type { UpdateMissionOrganizersDTO } from "../../../presentation/dto/mission/UpdateMissionOrganizersDTO.js";
import type { IActor } from "../../user/IActor.js";
import type { Mission } from "../Mission.js";


export interface IMissionService {
  createMission(missionToCreateDTO: CreateMissionDTO, actor: IActor): Promise<Mission>;
  updateMissionDetails(dto:UpdateMissionDetailsDTO,missionUuid:string,actor:IActor):Promise<Mission>;
  updateMissionOrganizers(dto:UpdateMissionOrganizersDTO,missionUuid:string,actor:IActor):Promise<Mission>;
  publishMission(missionUuid: string): Promise<void>;
  cancelMission(missionUuid: string): Promise<void>;
  deleteMission(missionUuid: string): Promise<void>;
  finishMission(missionUuid: string, presentUuids: string[]): Promise<void>;
  registerVolunteer(missionUuid: string, volunteerUuid: string): Promise<void>;
  getMissions(filters: SearchMissionDTO): Promise<Mission[]>;
  getMissionDetail(missionUuid: string): Promise<Mission>;

}
