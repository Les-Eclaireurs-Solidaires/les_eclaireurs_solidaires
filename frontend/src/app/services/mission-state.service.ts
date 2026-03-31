import { Injectable, WritableSignal, computed, inject, resource, signal } from '@angular/core';
import { MissionAPIService } from './mission-api.service';
import { MissionModel } from '../models/mission.model';
import { SearchMission } from '../dtos/search-mission';
import { MissionsNotFoundError } from '../exceptions/missions-not-found-error';

@Injectable({
  providedIn: 'root',
})
export class MissionStateService {
  private missionAPIService: MissionAPIService = inject(MissionAPIService);
  public searchFilters: WritableSignal<SearchMission> = signal<SearchMission>({});

  public missions = signal<MissionModel[]>([]);
  public recentMissions = signal<MissionModel[]>([]);

  /* public missionsResource = rxResource<MissionModel[], SearchMission>({
    defaultValue: [],
    params: () => this.searchFilters(),
    stream: ({ params }) =>
      this.missionAPIService
        .getAllMissions(params)
        .pipe(map((missions) => missions.map((m) => new MissionModel(m)))),
  }); */

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
        throw new MissionsNotFoundError("Erreur lors de la récupération des missions");
      },
    });
  }

  public loadRecentMissions() {
    if (this.recentMissions().length > 0) return;

    this.missions().filter((mission) => {
      mission.dateStart > new Date();
    });
  }
}
