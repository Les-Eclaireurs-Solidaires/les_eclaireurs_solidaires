import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { debounceTime, map } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

import { MissionStatus } from '../../models/mission-response.interface';
import { SearchMission } from '../../dtos/search-mission';

@Component({
  selector: 'app-filter-component',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './filter-component.html',
  styleUrl: './filter-component.css',
})
export class FilterComponent {
  public filterForm = new FormGroup({
    status: new FormControl<MissionStatus | null>(null),
    name: new FormControl<string | null>(null),
    cityId: new FormControl<number | null>(null),
    dateStart: new FormControl<Date | null>(null),
  });

  public filterMissions = outputFromObservable<SearchMission>(
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      map((filters) => filters as SearchMission),
    ),
  );
}
