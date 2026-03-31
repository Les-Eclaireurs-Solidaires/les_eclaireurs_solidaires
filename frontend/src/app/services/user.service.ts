import {
  computed,
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  signal,
  TransferState,
} from '@angular/core';
import { IUserFromBack, UserModel, UserRole } from '../models/user.model';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth-service';

const USER_KEY = makeStateKey<IUserFromBack | null>('currentUser');

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  readonly router = inject(Router);
  readonly notificationService = inject(NotificationService);
  readonly auth = inject(AuthService);

  public currentUser = signal<UserModel | null>(this.hydrateFromTransferState());

  public userRole = signal<UserRole>(this.currentUser()?.getRole() ?? UserRole.BENEVOLE);

  public isAuthenticated = computed(() => this.currentUser() !== null);

  private hydrateFromTransferState(): UserModel | null {
    const raw = this.transferState.get(USER_KEY, null);
    if (!raw) return null;
    return UserModel.reconstitute(raw);
  }

  public loginUser(user: UserModel) {
    this.currentUser.set(user);
    this.userRole.set(user.getRole());

    // Sauvegarder le TransferState pour hydratation côté client
    this.transferState.set(USER_KEY, user.toJSON());
  }

  public logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.currentUser.set(null);
        this.userRole.set(UserRole.BENEVOLE);
        this.transferState.remove(USER_KEY);

        if (isPlatformBrowser(this.platformId)) {
          this.router.navigate(['/']);
          this.notificationService.showError('Vous avez été déconnecté');
        }
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Erreur lors de la déconnexion');
      },
    });
  }
}
