import { computed, inject, Injectable, makeStateKey, signal, TransferState } from '@angular/core';
import { UserModel, UserParam } from '../domain/user/user.model';
import { AuthApiService } from './auth-api.service';
import { catchError, Observable, of, tap } from 'rxjs';
export interface IAuthResponse {
  uuid: string;
  email: string;
  roleId: number;
}
const USER_KEY = makeStateKey<UserParam | null>('currentUser');
@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private transferState = inject(TransferState);
  private authApiService = inject(AuthApiService);
  private _currentUser = signal<UserModel | null>(null);
  public currentUser = this._currentUser.asReadonly();

  public isAuthenticated = computed(() => this.currentUser() !== null);
  public isEmail = computed(() => this.currentUser()?.getEmail() ?? '');

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
    console.log('🟢 [SSR] Utilisateur trouvé dans le TransferState :', cachedUser);
    if (cachedUser) {
      this.updateState(cachedUser);
      return of(cachedUser);
    }
    console.log('🟡 [API] Aucun utilisateur en cache, appel de /auth/me...');
    return this.authApiService.refreshUser().pipe(
      tap((user) => {
        console.log('✅ [API] Réponse reçue avec succès :', user);
        this.updateState(user);
      }),
      catchError((err) => {
        console.error('🔴 [API] Échec de la récupération :', err);
        this.updateState(null);
        return of(null);
      }),
    );
  }
  public login(credentials: { email: string; password: string }): Observable<UserModel> {
    return this.authApiService.login(credentials).pipe(
      tap((user) => {
        this.updateState(user);
      }),
    );
  }
  public register(credentials: { email: string; password: string }): Observable<UserModel> {
    return this.authApiService.register(credentials).pipe(
      tap((user) => {
        this.updateState(user);
      }),
    );
  }
  public logout(): Observable<any> {
    return this.authApiService.logout().pipe(
      tap(() => {
        this.clear();
      }),
      catchError(() => {
        this.clear();
        return of(null);
      }),
    );
  }
  public clear() {
    this._currentUser.set(null);
    this.transferState.remove(USER_KEY);
  }
}
