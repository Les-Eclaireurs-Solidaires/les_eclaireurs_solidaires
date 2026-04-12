import { Component, inject, OnInit, Signal, signal } from '@angular/core';
import { MissionFormComponent } from '../components/mission-form.component/mission-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MissionStateService } from '../../services/mission-state.service';
import { MissionModel } from '../../models/mission.model';
import { MissionDTO } from '../../interfaces/MissionDTO';
import { NotificationService } from '../../../../services/notification.service';
import { of, switchMap } from 'rxjs';
import { City } from '../../../city/City';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CityApiService } from '../../../../services/city-api.service';

@Component({
  selector: 'app-mission-form-page',
  imports: [MissionFormComponent],
  templateUrl: './mission-form-page.html',
  styleUrl: './mission-form-page.css',
})
export class MissionFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private missionState = inject(MissionStateService);
  private cityApi = inject(CityApiService);
  private notifService = inject(NotificationService);

  public isEditMode = signal<boolean>(false);
  public missionData = this.missionState.selectedMission;
  private currentUuid: string | null = null;
  private searchCity = signal<string>('');
  public cityOptions: Signal<City[]>;
  public defaultCities: City[] = [
    {
      id: 0,
      name: '',
      zip: ''
    },
    {
      id: -1,
      name: 'Paris',
      zip: '75000'
    },
    {
      id: -2,
      name: 'Lyon',
      zip: '69000'
    }
  ]

  constructor() {
    this.cityOptions = toSignal(
      toObservable(this.searchCity).pipe(
        switchMap((query) => (query ? this.cityApi.searchCity(query) : of(this.defaultCities))),
      ),
      { initialValue: this.defaultCities }
    );
  }

  ngOnInit() {
    this.currentUuid = this.route.snapshot.paramMap.get('uuid');
    console.log(this.currentUuid);
    
    
    if (this.currentUuid) {
      this.isEditMode.set(true);
      this.missionState.loadMission(this.currentUuid);
    } else {
      this.isEditMode.set(false);
    }
    console.log(this.missionData());
  }

  public onSave(dto: MissionDTO) {
    const currentUuid = this.route.snapshot.paramMap.get('uuid');

    this.missionState.saveMission(dto, currentUuid ?? undefined).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/myMissionCreated']);
      },
    });
    console.log(dto);
  }

  public onCitySearch(search: string) {
    this.searchCity.set(search);
  }
}
