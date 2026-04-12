import { Component, inject } from '@angular/core';
import { MissionStateService } from '../../../../mission/services/mission-state.service';
import { MissionListComponent } from '../../../../mission/pages/mission-list-component/mission-list-component';

@Component({
  selector: 'app-my-missions-created',
  imports: [MissionListComponent],
  templateUrl: './my-missions-created.html',
  styleUrl: './my-missions-created.css',
})
export class MyMissionsCreated {
  public missionState = inject(MissionStateService);

}
