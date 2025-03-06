import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';

@Component({
  selector: 'app-hotel-owner-my-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AuthModalsComponent
  ],
  templateUrl: './hotel-owner-my-account.component.html',
  styleUrls: ['./hotel-owner-my-account.component.css']
})
export class HotelOwnerMyAccountComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false;
  userFullName: string | null = null;
  userEmail: string | null = null;
  userPhoneNumber: string | null = null;
  userInitial: string | null = null;
  showUserDropdown: boolean = false; // Added for dropdown toggle

  // Form fields for updating profile
  fullName: string = '';
  phoneNumber: string = '';
  password: string = '';
  updateMessage: string = '';
  updateError: string = '';
  private userSub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Fetch user data from localStorage or AuthService
    this.userFullName = localStorage.getItem('userFullName');
    this.userEmail = localStorage.getItem('userEmail');
    this.userPhoneNumber = localStorage.getItem('userPhoneNumber');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    // Initialize form fields with current user data
    this.fullName = this.userFullName || '';
    this.phoneNumber = this.userPhoneNumber || '';

    // Subscribe to user updates
    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userEmail = localStorage.getItem('userEmail');
      this.userPhoneNumber = localStorage.getItem('userPhoneNumber');
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
        // Update localStorage with new values
        if (this.fullName) localStorage.setItem('userFullName', this.fullName);
        if (this.phoneNumber) localStorage.setItem('userPhoneNumber', this.phoneNumber);
        // Update userInitial if fullName changes
        this.userInitial = this.fullName ? this.fullName.charAt(0).toUpperCase() : null;
        // Clear password field after update
        this.password = '';
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
    // The logout method in AuthService will close the tab
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}