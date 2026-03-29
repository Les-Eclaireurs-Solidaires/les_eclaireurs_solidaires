import { Component, inject, input } from '@angular/core';
import { MissionStateService } from '../../services/mission-state.service';
import { MissionModel } from '../../models/mission.model';

@Component({
  selector: 'app-mission-list-component',
  imports: [],
  templateUrl: './mission-list-component.html',
  styleUrl: './mission-list-component.css',
})
export class MissionListComponent {
  public missions = input<MissionModel[]>([]);

}
