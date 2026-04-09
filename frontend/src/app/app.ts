import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/components/footer/footer';
import { TopMenuComponent } from './shared/pages/top-menu.component/top-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopMenuComponent, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
