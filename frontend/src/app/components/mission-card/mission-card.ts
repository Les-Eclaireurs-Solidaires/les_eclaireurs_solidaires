import { Component, inject, input } from '@angular/core';
import { IMissionResponse } from '../../models/mission-response.interface';
import { MissionModel } from '../../models/mission.model';
import { Router } from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [MatCardModule,MatChipsModule],
  templateUrl: './mission-card.html',
  styleUrl: './mission-card.css',
})
export class MissionCard {
  private router = inject(Router);
  public mission = input.required<MissionModel>();

  onMissionClicked() {
    this.mission();
  }
}
