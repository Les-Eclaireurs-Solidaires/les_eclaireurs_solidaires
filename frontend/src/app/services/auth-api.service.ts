import { inject, Injectable } from '@angular/core';
import { map, Observable} from 'rxjs';
import { UserModel } from '../domain/user/user.model';
import { HttpClient } from '@angular/common/http';
import {  IAuthResponse } from './auth-state.service';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  public httpService = inject(HttpClient);
  private readonly API_URL = '/auth';

  register(credentials: { email: string; password: string }): Observable<UserModel> {
    return this.httpService
      .post<IAuthResponse>(`${this.API_URL}/register`, credentials, {
        withCredentials: true,
      })
      .pipe(map((response) => UserModel.reconstitute(response)));
  }

  login(credentials: { email: string; password: string }): Observable<UserModel> {
    return this.httpService
      .post<IAuthResponse>(`${this.API_URL}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(map((response) => UserModel.reconstitute(response)));
  }

  refreshToken(): Observable<UserModel> {
    return this.httpService
      .post<IAuthResponse>(
        `${this.API_URL}/refresh`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(map((response) => UserModel.reconstitute(response)));
  }

  refreshUser(): Observable<UserModel> {
    return this.httpService
      .get<IAuthResponse>(`${this.API_URL}/me`, {
        withCredentials: true,
      })
      .pipe(map((response) => UserModel.reconstitute(response)));
  }
  logout(): Observable<any> {
    return this.httpService.post(`${this.API_URL}/logout`, {}, { withCredentials: true });
  }
}
