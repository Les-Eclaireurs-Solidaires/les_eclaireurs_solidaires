import { Component, inject, OnInit } from '@angular/core';
import { MissionStateService } from '../../services/mission-state.service';
import { SearchMission } from '../../interfaces/search-mission';
import { MissionModel } from '../../models/mission.model';
import { Router } from '@angular/router';
import { MissionListComponent } from '../mission-list-component/mission-list-component';
import { FilterComponent } from '../components/filter-component/filter-component';

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
    this.missionStateService.initializePublicMissions();
  }

  onFilterChanged(newFilters: SearchMission): void {
    this.missionStateService.searchFilters.set(newFilters);
    this.missionStateService.initializePublicMissions();
  }

  goToMission(mission: MissionModel) {
    this.router.navigate(['mission', mission.getUuid()]);
  }
}
