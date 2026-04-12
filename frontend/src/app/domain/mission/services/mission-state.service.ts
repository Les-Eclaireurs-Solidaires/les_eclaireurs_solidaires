import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  Signal,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { MissionAPIService } from './mission-api.service';
import { MissionModel } from '../models/mission.model';
import { SearchMission } from '../interfaces/search-mission';
import { MissionsNotFoundError } from '../../../core/exceptions/missions-error.error';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardFilters } from '../../user/interface/DashboardFilters';
import { MissionStatus } from '../mission-response.interface';
import { catchError, tap } from 'rxjs';
import { NotificationService } from '../../../services/notification.service';
import { MissionDTO } from '../interfaces/MissionDTO';

@Injectable({
  providedIn: 'root',
})
export class MissionStateService {
  private platformId: Object = inject(PLATFORM_ID);
  private destroyedRef: DestroyRef = inject(DestroyRef);
  private notifService: NotificationService = inject(NotificationService);
  private missionAPIService: MissionAPIService = inject(MissionAPIService);

  private _loading: WritableSignal<boolean> = signal<boolean>(false);
  public loading: Signal<boolean> = this._loading.asReadonly();

  private _createdMissions = signal<MissionModel[]>([]);
  public createdMissions = this._createdMissions.asReadonly();
  private _organizedMissions = signal<MissionModel[]>([]);
  public organizedMissions = this._organizedMissions.asReadonly();
  private _participatedMissions = signal<MissionModel[]>([]);
  public participatedMissions = this._participatedMissions.asReadonly();

  private _publicMissions = signal<MissionModel[]>([]);
  public publicMissions = this._publicMissions.asReadonly();
  private _recentMissions = signal<MissionModel[]>([]);
  public recentMissions = this._recentMissions.asReadonly();
  private _selectedMission = signal<MissionModel | null>(null);
  public selectedMission = this._selectedMission.asReadonly();

  private filters: DashboardFilters = {
    status: [
      MissionStatus.DRAFT,
      MissionStatus.PUBLISHED,
      MissionStatus.CANCELED,
      MissionStatus.FINISHED,
    ],
  };

  public searchFilters: WritableSignal<SearchMission> = signal<SearchMission>({});

  public loadMission(uuid: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    this._loading.set(true);
    if (this._selectedMission() != null && this.selectedMission()?.getUuid() === uuid) return;
    this.missionAPIService
      .getMissionByUuid(uuid)
      .pipe(takeUntilDestroyed(this.destroyedRef))
      .subscribe({
        next: (mission) => {
          this._selectedMission.set(mission);
        },
        error: (err) => {
          this._selectedMission.set(null);
          this.notifService.showError('Erreur lors de la récupération de la mission');
          throw new MissionsNotFoundError('Erreur lors de la récupération des missions');
        },
        complete: () => {
          this._loading.set(false);
        },
      });
  }

  public initializePublicMissions() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this._publicMissions().length > 0) return;

    this._loading.set(true);
    this.missionAPIService
      .getAllMissions(this.searchFilters())
      .pipe(takeUntilDestroyed(this.destroyedRef))
      .subscribe({
        next: (missions) => {
          this._publicMissions.set(missions);
        },
        error: (err) => {
          this._publicMissions.set([]);
          this.notifService.showError('Erreur lors de la récupération des missions');
          throw new MissionsNotFoundError('Erreur lors de la récupération des missions');
        },
        complete: () => {
          this._loading.set(false);
        },
      });
  }

  public initializeDashboardMissions() {
    if (!isPlatformBrowser(this.platformId)) return;

    this._loading.set(true);
    this.missionAPIService
      .getDashboardMissions(this.filters)
      .pipe(takeUntilDestroyed(this.destroyedRef))
      .subscribe({
        next: (response) => {
          console.log(response);
          this._createdMissions.set(response?.created.map((m) => MissionModel.createFromApi(m)) ?? []);
          this._organizedMissions.set(response?.organized.map((m) => MissionModel.createFromApi(m)) ?? []);
          this._participatedMissions.set(
            response?.participated.map((m) => MissionModel.createFromApi(m)) ?? [],
          );
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => {
          this._loading.set(false);
        },
      });
  }
  public saveMission(missionData: MissionDTO, uuid?: string) {
    this._loading.set(true);
    const mode = uuid
      ? this.missionAPIService.updateMission(uuid, missionData)
      : this.missionAPIService.createMission(missionData);
    return mode.pipe(
      takeUntilDestroyed(this.destroyedRef),
      tap((savedMission) => {
        this._loading.set(false);
        if (uuid) {
          this._createdMissions.update((missions) =>
            missions.map((m) => (m.getUuid() === uuid ? savedMission : m)),
          );
        } else {
          this._createdMissions.update((missions) => [savedMission, ...missions]);
        }
      }),
      catchError((err: Error) => {
        this._loading.set(false);
        this.notifService.showError(`Erreur lors de la sauvegarde de la mission : ${err.message}`);
        throw new Error(err.message);
      }),
    );
  }
}
