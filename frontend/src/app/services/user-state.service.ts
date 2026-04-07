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
import { catchError, Observable, of, tap } from 'rxjs';

const USER_KEY = makeStateKey<IUserFromBack | null>('currentUser');

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  readonly router = inject(Router);
  readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);

  private _currentUser = signal<UserModel | null>(this.hydrateFromTransferState());
  public currentUser = this._currentUser.asReadonly();

  public isReady = signal<boolean>(false);

  public userRole = signal<UserRole>(UserRole.BENEVOLE);
  public isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    if (this.currentUser()) {
      this.userRole.set(this.currentUser()!.getRole());
    }
  }

  private hydrateFromTransferState(): UserModel | null {
    const raw = this.transferState.get(USER_KEY, null);
    return raw ? UserModel.reconstitute(raw) : null;
  }
  public initialize(): Observable<UserModel | null> {
    return this.authService.refreshUser().pipe(
      tap((user) => this._updateState(user)),
      catchError(() => {
        this._updateState(null);
        return of(null);
      }),
    );
  }
  private _updateState(user: UserModel | null) {
    this._currentUser.set(user);
    if (user) {
      this.userRole.set(user.getRole());
      this.transferState.set(USER_KEY, user.toJSON());
    } else {
      this.userRole.set(UserRole.BENEVOLE);
      this.transferState.remove(USER_KEY);
    }
    this.isReady.set(true);
  }
  public login(credentials: any): Observable<UserModel> {
    return this.authService.login(credentials).pipe(tap((user) => this._updateState(user)));
  }
  public register(data: any): Observable<UserModel> {
    return this.authService.register(data).pipe(tap((user) => this._updateState(user)));
  }
  public logout(isForced: boolean = false) {
    this.authService.logout().subscribe({
      next: () => this._clearAndRedirect(isForced),
      error: () => this._clearAndRedirect(isForced),
    });
  }
  private _clearAndRedirect(isForced: boolean) {
    this._updateState(null);
    if (isPlatformBrowser(this.platformId)) {
      if (isForced) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
