import { Component, inject } from '@angular/core';
import { MissionStateService } from '../../../../mission/services/mission-state.service';
import { MissionListComponent } from '../../../../mission/pages/mission-list-component/mission-list-component';

@Component({
  selector: 'app-my-missions-organized',
  imports: [MissionListComponent],
  templateUrl: './my-missions-organized.html',
  styleUrl: './my-missions-organized.css',
})
export class MyMissionsOrganized {
  public missionState = inject(MissionStateService);

}
