import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { UserModel } from '../domain/user/user.model';
import { HttpClient } from '@angular/common/http';
import { IAuthResponse } from './auth-state.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  public httpService = inject(HttpClient);
  private readonly API_URL = '/auth';

  register(credentials: { email: string; password: string }): Observable<IAuthResponse> {
    return this.httpService
      .post<IAuthResponse>(`${this.API_URL}/register`, credentials, {
        withCredentials: true,
      })
  }

  login(credentials: { email: string; password: string }): Observable<IAuthResponse> {
    return this.httpService
      .post<IAuthResponse>(`${this.API_URL}/login`, credentials, {
        withCredentials: true,
      })
  }

  refreshToken(): Observable<IAuthResponse | null> {
    return this.httpService.post<IAuthResponse>(
      `${this.API_URL}/refresh`,
      {},
      {
        withCredentials: true,
      },
    ).pipe(
      catchError(() => of(null)),
    );
  }
  logout(): Observable<any> {
    return this.httpService.post(`${this.API_URL}/logout`, {}, { withCredentials: true });
  }
}
