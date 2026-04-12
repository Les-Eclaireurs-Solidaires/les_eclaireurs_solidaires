import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IAuthResponse } from '../../../core/interfaces/IAuthResponse';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  public httpService = inject(HttpClient);
  private readonly API_URL = '/auth';

  public register(credentials: { email: string; password: string }): Observable<IAuthResponse> {
    return this.httpService.post<IAuthResponse>(`${this.API_URL}/register`, credentials, {
      withCredentials: true,
    });
  }

  public login(credentials: { email: string; password: string }): Observable<IAuthResponse> {
    return this.httpService.post<IAuthResponse>(`${this.API_URL}/login`, credentials, {
      withCredentials: true,
    });
  }

  public refreshToken(): Observable<IAuthResponse | null> {
    return this.httpService
      .post<IAuthResponse>(
        `${this.API_URL}/refresh`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(catchError(() => of(null)));
  }

  public logout(): Observable<any> {
    return this.httpService.post(`${this.API_URL}/logout`, {}, { withCredentials: true });
  }
}
