import { computed, inject, Injectable } from '@angular/core';
import { ISideMenuItem } from '../core/interfaces/ISideMenuItem';
import { AuthStateService } from '../domain/authentication/services/auth-state.service';
import { MissionStateService } from '../domain/mission/services/mission-state.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private authState = inject(AuthStateService);
  private missionState = inject(MissionStateService);

  private isAdmin = computed(() => this.authState.isAdmin());
  private isOrganizer = computed(() => this.authState.isOrganizer());

  public menuItems = computed<ISideMenuItem[]>(() => {
    const allLinks =  [
      {
        label: 'Mon Profil',
        icon: 'person',
        route: '/dashboard/profile',
        isVisible: true,
      },
      {
        label: 'Mes Missions',
        icon: 'event',
        route: '/dashboard/myMissions',
        isVisible: true,
      },
      {
        label: 'Mes Missions Créées',
        icon: 'campaign',
        route: '/dashboard/myMissionCreated',
        isVisible:
          this.isAdmin() ||
          this.isOrganizer() ||
          this.missionState.createdMissions().length > 0,
      },
      {
        label: 'Missions gérées',
        icon: 'admin_panel_settings',
        route: '/dashboard/myMissionOrganized',
        isVisible:
          this.missionState.organizedMissions().length > 0
      },
      {
        label: 'Créer Mission',
        icon: 'add_circle',
        route: '/dashboard/createMission',
        isVisible: this.isAdmin() || this.isOrganizer(),
      },
    ];
    return allLinks.filter(link => link.isVisible === true);
  });
}
