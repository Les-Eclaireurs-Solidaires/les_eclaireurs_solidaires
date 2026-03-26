import type { Mission } from "./MissionModel.js";

export interface IMissionRepository {
  findMany(filters: any): Promise<Mission[]>;
  findByName(name: string): Promise<Mission | null>;
  findByUuid(uuid: string): Promise<Mission | null>;
  create(missionToCreate: Mission, organizerIds: number[]): Promise<Mission>;
  update(mission: Mission): Promise<void>;
}
