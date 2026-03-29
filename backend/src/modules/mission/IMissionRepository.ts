import type { Mission } from "./MissionModel.js";
import type { SearchMission } from "./payload/SearchMission.js";

export interface IMissionRepository {
  findMany(filters: SearchMission): Promise<Mission[]>;
  findByName(name: string): Promise<Mission | null>;
  findByUuid(uuid: string): Promise<Mission | null>;
  create(missionToCreate: Mission, organizerIds: number[]): Promise<Mission>;
  update(mission: Mission): Promise<void>;
}
