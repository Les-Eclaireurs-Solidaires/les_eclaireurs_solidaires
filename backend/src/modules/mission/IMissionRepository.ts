import type { Mission } from "./MissionModel.js";

export interface IMissionRepository {
  findByName(name: string): Promise<Mission | null>;
  findByUuid(uuid: string): Promise<Mission | null>;
  create(missionToCreate: Mission, organizerIds: number[]): Promise<Mission>;
}
