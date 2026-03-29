import { afterRenderEffect, Component, computed, inject } from '@angular/core';
import { MissionStateService } from '../services/mission-state.service';
import { MissionListComponent } from '../components/mission-list-component/mission-list-component';
import { FilterComponent } from '../components/filter-component/filter-component';
import { SearchMission } from '../dtos/search-mission';

@Component({
  selector: 'app-missions.page',
  imports: [MissionListComponent, FilterComponent],
  templateUrl: './missions.page.html',
  styleUrl: './missions.page.css',
})
export class MissionsPage {
  public missionStateService: MissionStateService = inject(MissionStateService);

   public missions = computed(
    () => this.missionStateService.missionsResource.value() ?? []
  );

  onFilterChanged(newFilters: SearchMission) : void {
    this.missionStateService.searchFilters.set(newFilters)
  }
}
