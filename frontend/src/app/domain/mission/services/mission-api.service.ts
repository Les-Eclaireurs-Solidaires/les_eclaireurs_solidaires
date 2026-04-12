import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SearchMission } from '../interfaces/search-mission';
import { formatDate } from '@angular/common';
import { DashboardFilters } from '../../user/interface/DashboardFilters';
import { IDashboardResponse } from '../../../core/interfaces/IDashboardResponse';
import { MissionModel } from '../models/mission.model';
import { MissionDTO } from '../interfaces/MissionDTO';
import { MissionFromApi } from '../mission-response.interface';

@Injectable({
  providedIn: 'root',
})
export class MissionAPIService {
  private readonly API_URL = '/api/mission';
  private http = inject(HttpClient);

  public getAllMissions(filters: SearchMission): Observable<MissionModel[]> {
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
      .get<{ message: string; missions: MissionFromApi[] }>(`${this.API_URL}/`, { params })
      .pipe(
        map((response) => response.missions.map((mission) => MissionModel.createFromApi(mission))),
      );
  }

  public getMissionByUuid(uuid: string): Observable<MissionModel> {
    return this.http
      .get<{ message: string; mission: MissionFromApi }>(`${this.API_URL}/${uuid}`)
      .pipe(map((response) => MissionModel.createFromApi(response.mission)));
  }

  public createMission(missionData: MissionDTO): Observable<MissionModel> {
    return this.http
      .post<{
        message: string;
        mission: MissionFromApi;
      }>(`${this.API_URL}/createMission`, missionData, { withCredentials: true })
      .pipe(map((response) => MissionModel.createFromApi(response.mission)));
  }

  public updateMission(uuid: string, missionData: MissionDTO): Observable<MissionModel> {
    return this.http
      .patch<MissionFromApi>(`${this.API_URL}/${uuid}`, missionData)
      .pipe(map((response) => MissionModel.createFromApi(response)));
  }

  public cancelMission(uuid: string): Observable<string> {
    return this.http
      .delete<{ message: string }>(`${this.API_URL}/cancelMission/${uuid}`)
      .pipe(map((response) => response.message));
  }

  public getDashboardMissions(filters: DashboardFilters): Observable<IDashboardResponse | null> {
    let params = new HttpParams();
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((s) => {
        params = params.append('status', s.toString());
      });
    }
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.cityId) {
      params = params.set('cityId', filters.cityId.toString());
    }
    if (filters.dateStart) {
      params = params.set('dateStart', filters.dateStart.toString());
    }
    if (filters.onlyMissions) {
      params = params.set('onlyMissions', filters.onlyMissions.toString());
    }

    return this.http
      .get<IDashboardResponse>('/api/user/dashboard', { params, withCredentials: true })
      .pipe(map((response) => response));
  }
}
