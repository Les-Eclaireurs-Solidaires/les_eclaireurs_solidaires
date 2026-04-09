import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { MissionAPIService } from './mission-api.service';
import { MissionModel } from '../models/mission.model';
import { SearchMission } from '../dtos/search-mission';
import { MissionsNotFoundError } from '../../../core/exceptions/missions-not-found-error';

@Injectable({
  providedIn: 'root',
})
export class MissionStateService {
  private missionAPIService: MissionAPIService = inject(MissionAPIService);
  public searchFilters: WritableSignal<SearchMission> = signal<SearchMission>({});

  public missions = signal<MissionModel[]>([]);
  public recentMissions = signal<MissionModel[]>([]);
  public selectedMission = signal<MissionModel | null>(null);

  public loadMission(uuid: string) {
    if (this.selectedMission() != null && this.selectedMission()?.uuid === uuid) return;
    this.missionAPIService.getMissionByUuid(uuid).subscribe({
      next: (mission) => {
        this.selectedMission.set(new MissionModel(mission));
      },
      error: (err) => {
        console.error(err);
        this.selectedMission.set(null);
        throw new MissionsNotFoundError('Erreur lors de la récupération de la mission');
      },
    });
  }

  public loadMissions() {
    if (this.missions().length > 0) return;

    this.missionAPIService.getAllMissions(this.searchFilters()).subscribe({
      next: (missions) => {
        console.log(missions);
        this.missions.set(missions.map((m) => new MissionModel(m)));
      },
      error: (err) => {
        console.error(err);
        this.missions.set([]);
        throw new MissionsNotFoundError('Erreur lors de la récupération des missions');
      },
    });
  }
}
