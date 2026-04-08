import type { PoolConnection } from "mysql2/promise";
import type { Mission } from "../Mission.js";
import type { SearchMissionDTO } from "../../../presentation/dto/mission/SearchMissionDTO.js";

export interface IMissionRepository {
  findByName(
    name: string,
    connection?: PoolConnection,
    lock?: boolean,
  ): Promise<Mission | null>;
  findByUuid(
    uuid: string,
    connection?: PoolConnection,
    lock?: boolean,
  ): Promise<Mission | null>;
  findMany(filters: SearchMissionDTO): Promise<Mission[]>;
  create(
    missionToCreate: Mission,
    connection?: PoolConnection,
  ): Promise<Mission>;
  updateDetails(
    missionToUpdate: Mission,
    connection?: PoolConnection,
  ): Promise<Mission>;
  updateOrganizers(
    missionToUpdate: Mission,
    connection?: PoolConnection,
  ): Promise<Mission>;
  updateCategories(
    missionToUpdate: Mission,
    connection?: PoolConnection,
  ): Promise<Mission>;

  delete(missionUuid: string, connection?: PoolConnection): Promise<void>;
}
