import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface DecodedToken {
  role: string;
  [key: string]: any;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  fullName: string = '';
  email: string = '';
  password: string = '';
  phoneNumber: string = '';
  errorMessage: string = '';
  isSigningUp: boolean = false;
  showPassword: boolean = false; // Add this

  constructor(private authService: AuthService, private router: Router) {}

  onSignup() {
    if (!this.fullName || !this.email || !this.password || !this.phoneNumber) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.isSigningUp = true;
    this.errorMessage = '';

    this.authService.registerCustomer(this.fullName, this.email, this.password, this.phoneNumber).subscribe({
      next: (response) => {
        console.log('Signup successful:', response);
        const token = response.token;
        const role = this.decodeJwt(token)?.role || response.role;

        if (token && role) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('userRole', role);
          this.isSigningUp = false;

          if (role === 'Customer') {
            this.router.navigate(['/customer-dashboard']);
          } else {
            this.errorMessage = 'Unexpected role after signup. Contact support.';
            this.isSigningUp = false;
          }
        } else {
          this.errorMessage = 'Signup failed: No token or role received.';
          this.isSigningUp = false;
        }
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

  togglePassword() { // Add this
    this.showPassword = !this.showPassword;
  }

  decodeJwt(token: string): DecodedToken | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }
}