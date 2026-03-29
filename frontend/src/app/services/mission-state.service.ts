import { Injectable, WritableSignal, computed, inject, resource, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MissionAPIService } from './mission-api.service';
import { MissionModel } from '../models/mission.model';
import { SearchMission } from '../dtos/search-mission';

@Injectable({
  providedIn: 'root',
})
export class MissionStateService {
 private missionAPIService: MissionAPIService = inject(MissionAPIService);
  public searchFilters: WritableSignal<SearchMission> = signal<SearchMission>({});

  public missionsResource = rxResource<MissionModel[], SearchMission>({
    defaultValue: [],
    params: () => this.searchFilters(),        
    stream: ({ params }) =>                    
      this.missionAPIService
        .getAllMissions(params)
        .pipe(
          map((missions) => missions.map((m) => new MissionModel(m)))
        ),
  });


}
