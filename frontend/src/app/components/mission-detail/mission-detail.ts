import { Component, input } from '@angular/core';
import { MissionModel } from '../../models/mission.model';

@Component({
  selector: 'app-mission-detail',
  imports: [],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.css',
})
export class MissionDetail {
  mission = input.required<MissionModel>();

}
