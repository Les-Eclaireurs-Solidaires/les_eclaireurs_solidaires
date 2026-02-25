import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  backendMessage = signal<string>('');

  private client = inject(HttpClient);

  constructor() {}

  ngOnInit() {
    this.client.get('/', { responseType: 'text' }).subscribe({
      next: (message) => {
        this.backendMessage.set(message.toString());
        console.log('Message from backend:', message);
      },
      error: (error) => console.error('Error fetching backend message:', error),
    });
  }
}
