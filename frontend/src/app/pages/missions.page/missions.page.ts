import { Component, inject, OnInit } from '@angular/core';
import { MissionListComponent } from '../components/mission-list-component/mission-list-component';
import { FilterComponent } from '../components/filter-component/filter-component';
import { MissionStateService } from '../../domain/mission/services/mission-state.service';
import { SearchMission } from '../../domain/mission/dtos/search-mission';
import { MissionModel } from '../../domain/mission/models/mission.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-missions.page',
  imports: [MissionListComponent, FilterComponent],
  templateUrl: './missions.page.html',
  styleUrl: './missions.page.css',
})
export class MissionsPage implements OnInit {
  private router = inject(Router);
  public missionStateService = inject(MissionStateService);

  ngOnInit(): void {
    this.missionStateService.loadMissions();
  }

  onFilterChanged(newFilters: SearchMission): void {
    this.missionStateService.searchFilters.set(newFilters);
    this.missionStateService.loadMissions();
  }

  goToMission(mission: MissionModel) {
    this.router.navigate(['/mission', mission.uuid]);
  }
}
