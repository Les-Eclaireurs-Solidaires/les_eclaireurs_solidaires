import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MissionModel } from '../../../models/mission.model';
import { MissionDTO } from '../../../interfaces/MissionDTO';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { City } from '../../../../city/City';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AuthStateService } from '../../../../authentication/services/auth-state.service';
@Component({
  selector: 'app-mission-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatDatepickerModule,
    MatButtonModule,
    MatInputModule,
    MatNativeDateModule,
    MatAutocompleteModule,
  ],
  templateUrl: './mission-form.component.html',
  styleUrl: './mission-form.component.css',
})
export class MissionFormComponent {
  private fb = inject(NonNullableFormBuilder);
  public initialMission = input<MissionModel | null>(null);
  public orgaUuid = input<string>("");

  public citySearch = output<string>();
  public cityOptions = input<City[]>([]);

  public options: City[] = [];

  public submitForm = output<MissionDTO>();

  public missionForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    dateStart: [null as Date | null, Validators.required],
    dateEnd: [null as Date | null, Validators.required],
    nbrVolunteerNeeded: [0, Validators.required],
    address: ['', Validators.required],
    citySearchText: ['', Validators.required],
    cityId: [0, Validators.required],
    categoryIds: [[] as number[]],
  });

  constructor() {
    effect(() => {
      const data = this.initialMission();
      if (data) {
        this.missionForm.patchValue({
          name: data.getName(),
          description: data.getDescription() ?? '',
          dateStart: data.getDateStart() ?? null,
          dateEnd: data.getDateEnd() ?? null,
          nbrVolunteerNeeded: data.getNbrVolunteerNeeded(),
          address: data.getAddress(),
          citySearchText: data.getAddress(),
          cityId: data.getCityId(),
          categoryIds: data.getCategoryIds(),
        });
      }
    });
    this.missionForm
      .get('citySearchText')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.citySearch.emit(value);
      });
  }

  onSubmit(isPublishing: boolean) {
    if (isPublishing && this.missionForm.invalid) {
      this.missionForm.markAllAsTouched();
      return;
    }
    const rawValues = this.missionForm.getRawValue();
    const formDataAsDTO: MissionDTO = {
      toPublish: isPublishing,
      name: rawValues.name,
      description: rawValues.description,
      dateStart: rawValues.dateStart ? rawValues.dateStart.toISOString() : null,
      dateEnd: rawValues.dateEnd ? rawValues.dateEnd.toISOString() : null,
      nbrVolunteerNeeded: rawValues.nbrVolunteerNeeded,
      address: rawValues.address,
      cityId: rawValues.cityId,
      categoryIds: rawValues.categoryIds,
      organizers: []
    };
    let finalMission: MissionModel;
    if (isPublishing) {
      finalMission = MissionModel.createPublishMission(formDataAsDTO, this.orgaUuid());
    } else {
      finalMission = MissionModel.createDraftFromForm(formDataAsDTO, this.orgaUuid());
    }
    this.submitForm.emit(finalMission.toDTO());

  }

  onCitySelected(city: City) {
    const selectedCityId = city.id;
    const eventcityName = city.name;
    const selectedCityName = eventcityName;
    this.missionForm.get('cityId')?.setValue(selectedCityId);
    this.missionForm.get('citySearchText')?.setValue(selectedCityName);
  }
}
