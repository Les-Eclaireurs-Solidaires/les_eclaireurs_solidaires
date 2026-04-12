import type { PoolConnection } from "mysql2/promise";
import type { Mission } from "../Mission.js";
import type { InternalFilterDTO } from "./InternalFilterDTO.js";

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
  findMany(filters: InternalFilterDTO): Promise<Mission[]>;
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
