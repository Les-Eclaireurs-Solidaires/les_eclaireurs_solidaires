import { MissionStatus } from '../../mission/mission-response.interface';

export class DashboardFilters {
  status!: MissionStatus[];
  onlyMissions?: boolean;

  cityId?: number;
  categoryIds?: number[];
  name?: string;
  dateStart?: Date;
  address?: string;
}
