import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { UserModel } from '../models/user.model';

export interface IAuthResponse {
  user: {
    uuid: string;
    email: string;
    roleId: number;
  };
}
export interface IUserResponse {
  uuid: string;
  email: string;
  roleId: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public httpService = inject(HttpClient);
  private readonly API_URL = '/auth';

  register(credentials: { email: string; password: string }): Observable<UserModel> {
    return this.httpService
      .post<IAuthResponse>(`${this.API_URL}/register`, credentials, {
        withCredentials: true,
      })
      .pipe(map((response) => UserModel.reconstitute(response.user)));
  }

  login(credentials: { email: string; password: string }): Observable<UserModel> {
    return this.httpService
      .post<IAuthResponse>(`${this.API_URL}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(map((response) => UserModel.reconstitute(response.user)));
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
      .pipe(map((response) => UserModel.reconstitute(response.user)));
  }

  refreshUser(): Observable<UserModel> {
    return this.httpService
      .get<IUserResponse>(`${this.API_URL}/me`, {
        withCredentials: true,
      })
      .pipe(map((response) => UserModel.reconstitute(response)));
  }

  logout(): Observable<any> {
    return this.httpService.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).pipe(
      tap((response) => console.log(response)),
    );
  }
}
