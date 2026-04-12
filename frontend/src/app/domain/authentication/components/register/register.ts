import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/notification.service';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authStateService = inject(AuthStateService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  registerForm: FormGroup = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    confirmPassword: new FormControl(''),
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.authStateService.register(this.registerForm.value).subscribe({
      next: () => this.router.navigate(['/']),
      error: (error) => {
        this.notificationService.showError(error.message);
        console.log(error);
      },
    });
  }
}
