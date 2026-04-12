import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-mission-create.page',
  imports: [MatFormFieldModule,MatLabel,ReactiveFormsModule,MatInputModule],
  templateUrl: './mission-create.page.html',
  styleUrl: './mission-create.page.css',
})
export class MissionCreatePage {
  

  createMissionForm: FormGroup = new FormGroup({
    missionName: new FormControl(''),
    missionDescription: new FormControl(''),
  });
  onCreateClicked() {
    if (this.createMissionForm.invalid) {
      this.createMissionForm.markAllAsTouched();
      return;
    }
  }
}
