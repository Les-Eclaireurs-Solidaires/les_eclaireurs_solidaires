import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UserParam } from '../interface/UserParam';
import { UserModel } from '../models/user.model';
import { IDashboardResponse } from '../../../core/interfaces/IDashboardResponse';
import { DashboardFilters } from '../interface/DashboardFilters';

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
