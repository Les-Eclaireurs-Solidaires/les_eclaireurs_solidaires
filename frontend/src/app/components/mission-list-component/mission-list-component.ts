import { Component, inject, input, WritableSignal } from '@angular/core';
import { MissionModel } from '../../models/mission.model';
import { MissionCard } from '../mission-card/mission-card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mission-list-component',
  imports: [MissionCard],
  templateUrl: './mission-list-component.html',
  styleUrl: './mission-list-component.css',
})
export class MissionListComponent {
  private router = inject(Router);
  public missions = input<MissionModel[]>([]);

  onMissionClicked(mission: MissionModel) {
    console.log(mission);
    this.router.navigate(['/missions', mission.uuid]);
  }

}
