import { Component, input } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import { MissionModel } from '../../../domain/mission/models/mission.model';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [MatCardModule,MatChipsModule],
  templateUrl: './mission-card.html',
  styleUrl: './mission-card.css',
})
export class MissionCard {
  public mission = input.required<MissionModel>();

  onMissionClicked() {
    this.mission();
  }
}
