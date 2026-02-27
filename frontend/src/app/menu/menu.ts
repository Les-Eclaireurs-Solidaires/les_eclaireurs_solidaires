import { Component } from '@angular/core';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatToolbarRow, MatIcon,RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {}
