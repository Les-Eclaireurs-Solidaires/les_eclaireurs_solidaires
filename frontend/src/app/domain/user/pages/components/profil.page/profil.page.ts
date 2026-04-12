import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UserStateService } from '../../../services/user-state.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profil.page',
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './profil.page.html',
  styleUrl: './profil.page.css',
})
export class ProfilPage {
  public userState = inject(UserStateService);
}
