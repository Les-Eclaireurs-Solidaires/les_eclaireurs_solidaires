import { computed, inject, Injectable, makeStateKey, signal, TransferState } from '@angular/core';
import { UserModel, UserParam } from '../domain/user/user.model';
import { UserApiService } from './user-api.service';
import { catchError, Observable, of, tap } from 'rxjs';
const USER_KEY = makeStateKey<UserParam | null>('currentUser');

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private transferState = inject(TransferState);
  private userApiService = inject(UserApiService);
  private _currentUser = signal<UserModel | null>(null);
  public currentUser = this._currentUser.asReadonly();

  /* public isAuthenticated = computed(() => this.currentUser() !== null);
  public isEmail = computed(() => this.currentUser()?.getEmail() ?? ''); */

  private _userFromTransferState(): UserModel | null {
    const raw = this.transferState.get(USER_KEY, null);
    return raw ? UserModel.reconstitute(raw) : null;
  }
  public updateState(user: UserModel | null) {
    if (user) {
      this._currentUser.set(user);
      this.transferState.set(USER_KEY, user.toJSON());
    } else {
      this.transferState.remove(USER_KEY);
    }
  }
  public initializeApp(): Observable<UserModel | null> {
    const cachedUser = this._userFromTransferState();
    if (cachedUser) {
      this.updateState(cachedUser);
      return of(cachedUser);
    }
    return this.userApiService.refreshUser().pipe(
      tap((user) => {
        this.updateState(user);
      }),
      catchError((err) => {
        this.updateState(null);
        return of(null);
      }),
    );
  }
}
