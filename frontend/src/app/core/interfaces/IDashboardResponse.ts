import { MissionFromApi } from '../../domain/mission/mission-response.interface';

export interface IDashboardResponse {
  created: MissionFromApi[];
  organized: MissionFromApi[];
  participated: MissionFromApi[];
}
