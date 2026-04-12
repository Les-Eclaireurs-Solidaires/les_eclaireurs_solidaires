import { computed, inject, Injectable, makeStateKey, signal, TransferState } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { catchError, Observable, of, tap, throwError, timeout } from 'rxjs';
import { IAuthResponse } from '../../../core/interfaces/IAuthResponse';


const AUTH_KEY = makeStateKey<IAuthResponse | null>('auth');

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private transferState = inject(TransferState);
  private authApiService = inject(AuthApiService);
  private _currentUser = signal<IAuthResponse | null>(null);
  public currentUser = this._currentUser.asReadonly();
  public isAdmin = computed(() => this.currentUser()?.roleId === 1);
  public isOrganizer = computed(() => this.currentUser()?.roleId === 2);
  public isVolunteer = computed(() => this.currentUser()?.roleId === 3);

  public isAuthenticated = computed(() => this.currentUser() !== null);
  public isEmail = computed(() => this.currentUser()?.email ?? '');

  private _authFromTransferState(): IAuthResponse | null {
    const raw = this.transferState.get(AUTH_KEY, null);
    return raw ? raw : null;
  }
  public updateState(authResponse: IAuthResponse | null) {
    this._currentUser.set(authResponse);
    if (authResponse) {
      this.transferState.set(AUTH_KEY, authResponse);
    } else {
      this.transferState.remove(AUTH_KEY);
    }
  }
  public initializeApp(): Observable<IAuthResponse | null> {
    const authCached = this._authFromTransferState();
    if (authCached) {
      this.updateState(authCached);
      return of(authCached);
    }
    return this.authApiService.refreshToken().pipe(
      timeout(5000),
      tap((authData) => {
        if (authData) {
          this.updateState(authData);
        }
      }),
      catchError(() => {
        this.updateState(null);
        return of(null);
      }),
    );
  }
  public login(credentials: { email: string; password: string }): Observable<IAuthResponse> {
    return this.authApiService.login(credentials).pipe(
      tap((authData) => {
        this.updateState(authData);
      }),
      catchError((err) => {
        this.updateState(null);
        return throwError(() => err);
      }),
    );
  }
  public register(credentials: {
    email: string;
    password: string;
  }): Observable<IAuthResponse | null> {
    return this.authApiService.register(credentials).pipe(
      tap((authData) => {
        this.updateState(authData);
      }),
      catchError((err) => {
        this.updateState(null);
        return throwError(() => err);
      }),
    );
  }
  public logout(): Observable<void> {
    return this.authApiService.logout().pipe(
      tap(() => {
        this.updateState(null);
      }),
      catchError((err) => {
        this.updateState(null);
        return throwError(() => err);
      })
    );
  }
}
