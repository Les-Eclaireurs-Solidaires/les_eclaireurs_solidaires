import { Component, input, output } from '@angular/core';
import { ISideMenuItem } from '../../../../../core/interfaces/ISideMenuItem';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  imports: [MatListModule, MatIconModule, RouterLink],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent {
  public menuItems = input.required<ISideMenuItem[]>();
  public isOpen = input<boolean>(false);
  public itemClicked = output<void>();
}
