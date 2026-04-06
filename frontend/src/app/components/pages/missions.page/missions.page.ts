import { Component, inject, OnInit } from '@angular/core';
import { MissionListComponent } from '../../mission-list-component/mission-list-component';
import { FilterComponent } from '../../filter-component/filter-component';
import { Router } from '@angular/router';
import { MissionStateService } from '../../../services/mission-state.service';
import { SearchMission } from '../../../dtos/search-mission';
import { MissionModel } from '../../../models/mission.model';

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
