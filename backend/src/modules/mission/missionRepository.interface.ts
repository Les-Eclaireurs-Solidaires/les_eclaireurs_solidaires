import type { CreateMissionDto } from "../../dtos/createMission.dto.js";
import type { IMission } from "./mission.interface.js";
import type { Mission } from "./mission.model.js";

export interface IMissionRepository {
  findByName(name: string): Promise<Mission | null>;
  findByUuid(uuid: string): Promise<Mission | null>;
  create(missionToCreate: Mission, organizerIds: number[]): Promise<Mission>;
}
