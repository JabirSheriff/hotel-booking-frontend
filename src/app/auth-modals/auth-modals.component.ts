import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auth-modals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-modals.component.html',
  styleUrls: ['./auth-modals.component.css']
})
export class AuthModalsComponent implements OnInit, OnDestroy {
  showSignupModal: boolean = false;
  showLoginModal: boolean = false;

  signupFullName: string = '';
  signupEmail: string = '';
  signupPassword: string = '';
  signupPhoneNumber: string = '';
  signupErrorMessage: string = '';
  signupIsSigningUp: boolean = false;
  signupShowPassword: boolean = false;

  loginEmail: string = '';
  loginPassword: string = '';
  loginErrorMessage: string = '';
  loginIsLoggingIn: boolean = false;
  loginShowPassword: boolean = false;

  private signupModalSub: Subscription | undefined;
  private loginModalSub: Subscription | undefined;

  @Output() modalVisibilityChange = new EventEmitter<boolean>(); // Emit modal visibility state

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.signupModalSub = this.authService.showSignupModal$.subscribe(show => {
      this.showSignupModal = show;
      this.emitModalVisibility();
    });

    this.loginModalSub = this.authService.showLoginModal$.subscribe(show => {
      this.showLoginModal = show;
      this.emitModalVisibility();
    });
  }

  private emitModalVisibility(): void {
    const isModalOpen = this.showSignupModal || this.showLoginModal;
    this.modalVisibilityChange.emit(isModalOpen);
  }

  closeModals(): void {
    this.authService.closeModals();
    this.signupFullName = '';
    this.signupEmail = '';
    this.signupPassword = '';
    this.signupPhoneNumber = '';
    this.signupErrorMessage = '';
    this.signupIsSigningUp = false;
    this.signupShowPassword = false;
    this.loginEmail = '';
    this.loginPassword = '';
    this.loginErrorMessage = '';
    this.loginIsLoggingIn = false;
    this.loginShowPassword = false;
    this.emitModalVisibility();
  }

  onSignup(): void {
    if (!this.signupFullName || !this.signupEmail || !this.signupPassword || !this.signupPhoneNumber) {
      this.signupErrorMessage = 'All fields are required.';
      return;
    }

    this.signupIsSigningUp = true;
    this.signupErrorMessage = '';

    this.authService.registerCustomer(this.signupFullName, this.signupEmail, this.signupPassword, this.signupPhoneNumber).subscribe({
      next: (response) => {
        console.log('Signup successful:', response);
        setTimeout(() => {
          this.signupIsSigningUp = false;
          this.closeModals();
        }, 5000);
      },
      error: (error) => {
        console.error('Signup error:', error);
        this.signupErrorMessage = error.error?.title || 'Signup failed. Email may already be taken.';
        this.signupIsSigningUp = false;
      },
      complete: () => {
        console.log('Signup request completed.');
      }
    });
  }

  signupTogglePassword(): void {
    this.signupShowPassword = !this.signupShowPassword;
  }

  onLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.loginErrorMessage = 'Email and password are required.';
      return;
    }

    this.loginIsLoggingIn = true;
    this.loginErrorMessage = '';

    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        setTimeout(() => {
          this.loginIsLoggingIn = false;
          this.closeModals();
        }, 3000);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loginErrorMessage = error.error?.title || 'Invalid email or password.';
        this.loginIsLoggingIn = false;
      },
      complete: () => {
        console.log('Login request completed.');
      }
    });
  }

  loginTogglePassword(): void {
    this.loginShowPassword = !this.loginShowPassword;
  }

  openSignupModal(): void {
    this.authService.openSignupModal();
  }

  openLoginModal(): void {
    this.authService.openLoginModal();
  }

  ngOnDestroy(): void {
    if (this.signupModalSub) {
      this.signupModalSub.unsubscribe();
    }
    if (this.loginModalSub) {
      this.loginModalSub.unsubscribe();
    }
  }
}