import { Component, input, output } from '@angular/core';
import { MatToolbar} from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatIcon, RouterLink, MatButtonModule, MatMenuModule,MatToolbar],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {

  public isAuthenticated = input<boolean>(false);

  public loginRequest = output<void>();
  public logoutRequest = output<void>();
  public findMissionRequest = output<void>();
  public goToDashboard = output<void>();
  public isEmail = input<string>("");



}
