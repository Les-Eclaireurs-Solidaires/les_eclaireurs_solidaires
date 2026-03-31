import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IMissionResponse } from '../models/mission-response.interface';
import { SearchMission } from '../dtos/search-mission';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class MissionAPIService {
  private readonly API_URL = '/mission';
  private http = inject(HttpClient);

  public getAllMissions(filters: SearchMission): Observable<IMissionResponse[]> {
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status.toString());
    }
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.cityId) {
      params = params.set('cityId', filters.cityId.toString());
    }
    if (filters.dateStart) {
      params = params.set('dateStart', formatDate(filters.dateStart, 'yyyy-MM-dd', 'en-US'));
    }
    return this.http
      .get<{
        message: string;
        missions: IMissionResponse[];
      }>(`${this.API_URL}/missions`, { params })
      .pipe(map((response) => response.missions));
  }

  public getMissionByUuid(uuid: string): Observable<IMissionResponse> {
    return this.http
      .get<{ message: string; mission: IMissionResponse }>(`${this.API_URL}/mission/${uuid}`)
      .pipe(map((response) => response.mission));
  }

  public createMission(missionData: any): Observable<IMissionResponse> {
    return this.http
      .post<{
        message: string;
        mission: IMissionResponse;
      }>(`${this.API_URL}/createMission`, missionData)
      .pipe(map((response) => response.mission));
  }

  public cancelMission(uuid: string): Observable<string> {
    return this.http
      .delete<{ message: string }>(`${this.API_URL}/cancelMission/${uuid}`)
      .pipe(map((response) => response.message));
  }
}
