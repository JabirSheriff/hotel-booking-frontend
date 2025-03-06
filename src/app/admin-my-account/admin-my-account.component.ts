import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';

@Component({
  selector: 'app-admin-my-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AuthModalsComponent
  ],
  templateUrl: './admin-my-account.component.html',
  styleUrls: ['./admin-my-account.component.css']
})
export class AdminMyAccountComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false;
  userFullName: string | null = null;
  userEmail: string | null = null;
  userPhoneNumber: string | null = null;
  userInitial: string | null = null;
  showUserDropdown: boolean = false;
  private userSub: Subscription | undefined;

  // Form fields for updating profile
  fullName: string = '';
  phoneNumber: string = '';
  password: string = '';
  updateMessage: string = '';
  updateError: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Fetch user data from sessionStorage
    this.userFullName = sessionStorage.getItem('userFullName');
    this.userEmail = sessionStorage.getItem('userEmail');
    this.userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    // Initialize form fields
    this.fullName = this.userFullName || '';
    this.phoneNumber = this.userPhoneNumber || '';

    // Subscribe to user updates
    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userEmail = sessionStorage.getItem('userEmail');
      this.userPhoneNumber = sessionStorage.getItem('userPhoneNumber');
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
      this.fullName = this.userFullName || '';
      this.phoneNumber = this.userPhoneNumber || '';
    });
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  updateProfile(): void {
    this.updateMessage = '';
    this.updateError = '';

    this.authService.updateUserProfile(this.fullName, this.phoneNumber, this.password).subscribe({
      next: (response) => {
        this.updateMessage = response.message || 'Profile updated successfully.';
        if (this.fullName) sessionStorage.setItem('userFullName', this.fullName);
        if (this.phoneNumber) sessionStorage.setItem('userPhoneNumber', this.phoneNumber);
        this.userInitial = this.fullName ? this.fullName.charAt(0).toUpperCase() : null;
        this.password = ''; // Clear password field
      },
      error: (error) => {
        this.updateError = error.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
    // Window closes via AuthService logout
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}