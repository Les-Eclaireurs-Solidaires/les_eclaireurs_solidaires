import { computed, DestroyRef, inject, Injectable, makeStateKey, PLATFORM_ID, signal } from '@angular/core';
import { UserApiService } from './user-api.service';
import { UserParam } from '../interface/UserParam';
import { UserModel } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
const USER_KEY = makeStateKey<UserParam | null>('currentUser');

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private platformId = inject(PLATFORM_ID);
  private destroyedRef = inject(DestroyRef);
 private _isLoading = signal<boolean>(false);
  public isLoading = this._isLoading.asReadonly();
  private userApiService = inject(UserApiService);
  private _currentUser = signal<UserModel | null>(null);
  public currentUser = this._currentUser.asReadonly();
  public myAvatar = computed(() => this.currentUser()?.getAvatarUrl() ?? '');
  public myRole = computed(() => this.currentUser()?.getRole());

  public initializeProfile() {
    if (!isPlatformBrowser(this.platformId)) return;
    this._isLoading.set(true);
    this.userApiService.refreshUser()
      .pipe(takeUntilDestroyed(this.destroyedRef))
    .subscribe({
      next: (user) => {
        this._currentUser.set(user);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this._currentUser.set(null);
        this._isLoading.set(false);
      },
    });
  }
}
