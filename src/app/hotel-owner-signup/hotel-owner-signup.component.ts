import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-hotel-owner-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './hotel-owner-signup.component.html',
  styleUrls: ['./hotel-owner-signup.component.css']
})
export class HotelOwnerSignupComponent {
  fullName: string = '';
  email: string = '';
  password: string = '';
  phoneNumber: string = '';
  errorMessage: string = '';
  isSigningUp: boolean = false;
  successMessage: string = '';
  showPassword: boolean = false; // Password toggle

  constructor(private authService: AuthService, private router: Router) {}

  onSignup() {
    if (!this.fullName || !this.email || !this.password || !this.phoneNumber) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.isSigningUp = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.registerHotelOwner(this.fullName, this.email, this.password, this.phoneNumber).subscribe({
      next: (response) => {
        console.log('Hotel Owner signup successful:', response);
        this.isSigningUp = false;
        this.successMessage = 'Signup successful! Please wait for Admin approval, then log in.';
        setTimeout(() => {
          this.router.navigate(['/']); // Redirect to login after 2 seconds
        }, 2000);
      },
      error: (error) => {
        console.error('Signup error:', error);
        this.errorMessage = error.error?.title || 'Signup failed. Email may already be taken.';
        this.isSigningUp = false;
      },
      complete: () => {
        console.log('Signup request completed.');
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}