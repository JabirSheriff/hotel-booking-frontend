import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    AuthModalsComponent
  ],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css']
})
export class MyAccountComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false;
  userFullName: string | null = null;
  userInitial: string | null = null;
  userEmail: string | null = null;
  userPhoneNumber: string | null = null;
  private userSub: Subscription | undefined;

  // Edit modal state
  showEditModal: boolean = false;
  isPasswordOnlyMode: boolean = false;
  editFullName: string = '';
  editPhoneNumber: string = '';
  editPassword: string = '';
  showEditPassword: boolean = false;
  isSaving: boolean = false; // Loading state
  errorMessage: string = ''; // Error message

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userFullName = localStorage.getItem('userFullName');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    this.userEmail = localStorage.getItem('userEmail');
    this.userPhoneNumber = localStorage.getItem('userPhoneNumber') || '123-456-7890';

    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    });
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  openEditModal(): void {
    this.isPasswordOnlyMode = false;
    this.showEditModal = true;
    this.initializeEditForm();
  }

  openChangePasswordModal(): void {
    this.isPasswordOnlyMode = true;
    this.showEditModal = true;
    this.initializeEditForm();
  }

  initializeEditForm(): void {
    this.editFullName = this.userFullName || '';
    this.editPhoneNumber = this.userPhoneNumber || '';
    this.editPassword = '';
    this.showEditPassword = false;
    this.errorMessage = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.isPasswordOnlyMode = false;
    this.isSaving = false;
    this.errorMessage = '';
  }

  toggleEditPasswordVisibility(): void {
    this.showEditPassword = !this.showEditPassword;
  }

  saveChanges(): void {
    this.isSaving = true;
    this.errorMessage = '';

    const updateData = {
      fullName: this.isPasswordOnlyMode ? '' : this.editFullName, // Don't update fullName in password-only mode
      phoneNumber: this.isPasswordOnlyMode ? '' : this.editPhoneNumber, // Don't update phoneNumber in password-only mode
      password: this.editPassword || '' // Empty string if no new password
    };

    this.authService.updateUserProfile(updateData.fullName, updateData.phoneNumber, updateData.password).subscribe({
      next: (response) => {
        this.userFullName = this.editFullName;
        this.userPhoneNumber = this.editPhoneNumber;
        this.userInitial = this.editFullName ? this.editFullName.charAt(0).toUpperCase() : null;
        this.closeEditModal();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error.error?.error || 'Failed to update profile. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}