import { Component, input, output } from '@angular/core';
import { MissionModel } from '../../../domain/mission/models/mission.model';

@Component({
  selector: 'app-mission-detail',
  imports: [],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.css',
})
export class MissionDetail{
  public mission = input.required<MissionModel>();
  public backClick = output<void>();  
}
