import { MissionStatus } from "../mission-response.interface";

export interface SearchMission {
  status?: MissionStatus | null;
  name?: string | null;
  cityId?: number | null;
  dateStart?: Date | null;
}
