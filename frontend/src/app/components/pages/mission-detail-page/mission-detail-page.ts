import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { MissionDetail } from '../../mission-detail/mission-detail';
import { MissionStateService } from '../../../services/mission-state.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mission-detail-page',
  imports: [MissionDetail],
  templateUrl: './mission-detail-page.html',
  styleUrl: './mission-detail-page.css',
})
export class MissionDetailPage {
  public missionService = inject(MissionStateService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  ngOnInit(): void {
    const missionUuid = this.route.snapshot.paramMap.get('uuid');
    if (missionUuid) {
      this.missionService.loadMission(missionUuid);
    }
  }

  goBack() {
    this.location.back();
  }
}
