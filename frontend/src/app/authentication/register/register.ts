import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { UserModel } from '../../models/user.model';
import { AuthService } from '../../services/auth-service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
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
private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);


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
    this.authService.register(this.registerForm.value).subscribe({
      next: (user: UserModel) => {
        this.userService.loginUser(user);
        this.router.navigate(['/']);
        console.log(user);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
}
