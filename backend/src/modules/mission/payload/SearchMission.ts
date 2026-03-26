import type { MissionStatus } from "../MissionStatusEnum.js";

export interface SearchMission {
  status?: MissionStatus;
  name?: string
  cityId?: number;
  dateStart?: Date;
}
