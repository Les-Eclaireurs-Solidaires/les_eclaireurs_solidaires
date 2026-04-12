import { afterNextRender, Component, inject, signal } from '@angular/core';
import { SideBarComponent } from '../components/side-bar.component/side-bar.component';
import { NavigationService } from '../../../../services/navigation-service.service';
import { RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { UserStateService } from '../../services/user-state.service';
import { MissionStateService } from '../../../mission/services/mission-state.service';

@Component({
  selector: 'app-dashboard.page',
  imports: [SideBarComponent, RouterOutlet, MatIcon],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  public navigationService = inject(NavigationService);
  public missionState = inject(MissionStateService);
  public userStateService = inject(UserStateService);

  public menuLinks = this.navigationService.menuItems;

  public isSidenavOpen = signal<boolean>(true);
  public sidenavMode = signal<'over' | 'side'>('over');

  constructor() {
    afterNextRender(() => {
      this.missionState.initializeDashboardMissions();
      this.userStateService.initializeProfile();
    });
  }

  public toggleMenu() {
    this.isSidenavOpen.update((isOpen) => !isOpen);
  }

  public closeMenu() {
    this.isSidenavOpen.set(false);
  }
}
