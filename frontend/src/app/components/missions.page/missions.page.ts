import { Component, computed, inject, OnInit } from '@angular/core';
import { MissionListComponent } from '../mission-list-component/mission-list-component';
import { FilterComponent } from '../filter-component/filter-component';
import { MissionStateService } from '../../services/mission-state.service';
import { SearchMission } from '../../dtos/search-mission';

@Component({
  selector: 'app-missions.page',
  imports: [MissionListComponent, FilterComponent],
  templateUrl: './missions.page.html',
  styleUrl: './missions.page.css',
})
export class MissionsPage implements OnInit {
  
  public missionStateService: MissionStateService = inject(MissionStateService);

  ngOnInit(): void {
    this.missionStateService.loadMissions();
  }

  onFilterChanged(newFilters: SearchMission): void {
    this.missionStateService.searchFilters.set(newFilters);
    this.missionStateService.loadMissions();
  }
}
