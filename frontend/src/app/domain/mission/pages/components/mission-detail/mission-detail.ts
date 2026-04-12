import { Component, input, output } from '@angular/core';
import { MissionModel } from '../../../models/mission.model';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-mission-detail',
  imports: [RouterModule,MatButtonModule,MatIconModule,DatePipe],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.css',
})
export class MissionDetail{
  public mission = input.required<MissionModel>();
  public canEdit = input.required<boolean>();
  public backClick = output<void>();  
}
