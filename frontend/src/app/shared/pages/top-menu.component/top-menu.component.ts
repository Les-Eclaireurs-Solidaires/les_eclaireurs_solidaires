import { Component, inject } from '@angular/core';
import { MenuComponent } from '../../components/menu/menu.component';
import { UserStateService } from '../../../domain/user/services/user-state.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { AuthStateService } from '../../../domain/authentication/services/auth-state.service';

@Component({
  selector: 'app-top-menu',
  imports: [MenuComponent],
  templateUrl: './top-menu.component.html',
  styleUrl: './top-menu.component.css',
})
export class TopMenuComponent {
  public authStateService = inject(AuthStateService);
  public userStateService = inject(UserStateService);
  public router = inject(Router);
  public notifService = inject(NotificationService);

  handleLogout() {
    this.authStateService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
        this.notifService.showError('Vous êtes déconnecté');
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
  handleLogin() {
    this.router.navigate(['/login']);
  }
  handleFindMission() {
    this.router.navigate(['/missions']);
  }
  onDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
