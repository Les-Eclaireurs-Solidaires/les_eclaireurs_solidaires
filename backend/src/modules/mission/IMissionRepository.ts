import type { PoolConnection } from "mysql2/promise";
import type { SearchMissionDTO } from "./dtos/SearchMissionDTO.js";
import type { Mission } from "./MissionModel.js";

export interface IMissionRepository {
  findByName(name: string, connection?: PoolConnection, lock?: boolean): Promise<Mission | null>;
  findByUuid(uuid: string, connection?: PoolConnection, lock?: boolean): Promise<Mission | null>;
  findMany(filters: SearchMissionDTO): Promise<Mission[]>;
  create(missionToCreate: Mission, connection?: PoolConnection): Promise<Mission>;
  update(missionToUpdate: Mission): Promise<Mission>;
}
