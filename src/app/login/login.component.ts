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
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent  {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoggingIn: boolean = false;
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isLoggingIn = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        const token = response.token;
        const role = this.decodeJwt(token)?.role || response.role;

        if (token && role) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('userRole', role);
          
          // Store email only for Customer
          if (role === 'Customer') {
            localStorage.setItem('userEmail', this.email);
            this.router.navigate(['/']); // Customer to landing page
          } else if (role === 'HotelOwner') {
            this.router.navigate(['/hotel-owner-dashboard']); // HotelOwner to dashboard
          } else if (role === 'Admin') {
            this.router.navigate(['/admin-dashboard']); // Admin to dashboard
          } else {
            this.errorMessage = 'Invalid role. Contact support.';
            this.isLoggingIn = false;
            return;
          }
          this.isLoggingIn = false;
        } else {
          this.errorMessage = 'Login failed: No token or role received.';
          this.isLoggingIn = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = error.error?.title || 'Invalid email or password.';
        this.isLoggingIn = false;
      },
      complete: () => {
        console.log('Login request completed.');
      }
    });
  }

  togglePassword() {
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