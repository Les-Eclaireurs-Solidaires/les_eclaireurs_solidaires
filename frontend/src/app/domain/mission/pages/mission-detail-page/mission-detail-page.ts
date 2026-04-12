import { Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { MissionStateService } from '../../services/mission-state.service';
import { MissionDetail } from '../components/mission-detail/mission-detail';
import { AuthStateService } from '../../../authentication/services/auth-state.service';
import { UserRole } from '../../../user/interface/UserRoleEnum';

@Component({
  selector: 'app-mission-detail-page',
  imports: [MissionDetail],
  templateUrl: './mission-detail-page.html',
  styleUrl: './mission-detail-page.css',
})
export class MissionDetailPage {
  public missionState = inject(MissionStateService);
  public authService = inject(AuthStateService);
  private location = inject(Location);

  public mission = this.missionState.selectedMission;

  public canEdit = computed(() => {
    const currentMission = this.mission();
    const currentUser = this.authService.currentUser();

    if (!currentMission || !currentUser) return false;

    return (
      currentMission.getOrganizers()!.some((organizer) => organizer.organizerUuid === currentUser.uuid) ||
      currentUser.roleId === UserRole.SUPER_ADMIN
    );
  });

  goBack() {
    this.location.back();
  }
}
