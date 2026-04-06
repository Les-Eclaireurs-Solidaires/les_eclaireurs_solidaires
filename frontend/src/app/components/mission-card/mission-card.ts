import { Component, input } from '@angular/core';
import { MissionModel } from '../../models/mission.model';
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
  public mission = input.required<MissionModel>();

  onMissionClicked() {
    this.mission();
  }
}
