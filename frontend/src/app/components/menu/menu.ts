import { Component, inject } from '@angular/core';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { MatLabel } from '@angular/material/form-field';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatToolbarRow, MatIcon, RouterLink, MatLabel],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  public userService = inject(UserService);
}
