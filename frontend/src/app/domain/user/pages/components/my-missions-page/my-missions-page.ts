import { afterNextRender, Component, inject } from '@angular/core';
import { MissionListComponent } from '../../../../mission/pages/mission-list-component/mission-list-component';
import { MissionStateService } from '../../../../mission/services/mission-state.service';
import { MissionModel } from '../../../../mission/models/mission.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-missions-page',
  imports: [MissionListComponent],
  templateUrl: './my-missions-page.html',
  styleUrl: './my-missions-page.css',
})
export class MyMissionsPage {
  public missionState = inject(MissionStateService);
  private router = inject(Router);

  goToMission(mission: MissionModel) {
    this.router.navigate(['dashboard/mission', mission.getUuid()]);
  }
}
