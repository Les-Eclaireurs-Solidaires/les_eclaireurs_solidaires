import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { UserModel, UserParam } from '../domain/user/user.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  public httpService = inject(HttpClient);

  refreshUser(): Observable<UserModel | null> {
    return this.httpService
      .get<UserParam>(`/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => UserModel.reconstitute(response)),
        catchError(() => of(null)),
      );
  }
}
