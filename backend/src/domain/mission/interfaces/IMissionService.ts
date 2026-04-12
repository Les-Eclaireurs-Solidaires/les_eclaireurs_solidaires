import type { CreateMissionDTO } from "../../../presentation/dto/mission/CreateMissionDTO.js";
import type { FiltersInputDTO } from "../../../presentation/dto/mission/FiltersInputDTO.js";
import type { UpdateMissionDetailsDTO } from "../../../presentation/dto/mission/UpdateMissionDetailsDTO.js";
import type { UpdateMissionOrganizersDTO } from "../../../presentation/dto/mission/UpdateMissionOrganizersDTO.js";
import type { IActor } from "../../user/IActor.js";
import type { Mission } from "../Mission.js";
import type { IDashboardMission } from "./IDashboardMission.js";

export interface IMissionService {
  createMission(
    missionToCreateDTO: CreateMissionDTO,
    actor: IActor,
  ): Promise<Mission>;
  updateMissionDetails(
    dto: UpdateMissionDetailsDTO,
    missionUuid: string,
    actor: IActor,
  ): Promise<Mission>;
  updateMissionOrganizers(
    dto: UpdateMissionOrganizersDTO,
    missionUuid: string,
    actor: IActor,
  ): Promise<Mission>;
  publishMission(missionUuid: string, actor: IActor): Promise<void>;
  cancelMission(missionUuid: string, actor: IActor): Promise<void>;
  deleteMission(missionUuid: string, actor: IActor): Promise<void>;
  finishMission(
    missionUuid: string,
    presentUuids: string[],
    actor: IActor,
  ): Promise<void>;
  registerVolunteer(missionUuid: string, volunteerUuid: string): Promise<void>;
  getMissions(filters: FiltersInputDTO): Promise<Mission[]>;
  getMissionDetail(missionUuid: string): Promise<Mission>;
  getDashboardMission(filters: FiltersInputDTO, actor: IActor): Promise<IDashboardMission>;
}
