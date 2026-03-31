import { Component, input, output } from '@angular/core';
import { MissionModel } from '../../models/mission.model';
import { MissionCard } from '../mission-card/mission-card';

@Component({
  selector: 'app-mission-list-component',
  imports: [MissionCard],
  templateUrl: './mission-list-component.html',
  styleUrl: './mission-list-component.css',
})
export class MissionListComponent {
  public missions = input<MissionModel[]>([]);

  public missionSelected = output<MissionModel>();

  onMissionClicked(mission: MissionModel) {
    this.missionSelected.emit(mission);
  }
}
