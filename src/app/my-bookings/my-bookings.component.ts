import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    HeaderComponent,
    AuthModalsComponent
  ],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false; // Track header/auth modals visibility
  userFullName: string | null = null;
  userInitial: string | null = null;
  private userSub: Subscription | undefined;

  // Tab state
  activeTab: string = 'upcoming'; // Default to 'upcoming'

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Fetch user data from localStorage and AuthService
    this.userFullName = localStorage.getItem('userFullName');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    });

    // TODO: Fetch bookings data when content is added
    // this.fetchBookings();
  }

  // Method to switch between tabs
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Handle modal visibility changes (for auth modals)
  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  // Placeholder for fetching bookings (to be implemented later)
  fetchBookings(): void {
    // Example API call (to be implemented with actual backend API)
    /*
    this.http.get<Booking[]>(`${environment.apiUrl}/bookings`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    }).subscribe({
      next: (bookings) => {
        // Filter bookings into upcoming, cancelled, and completed
        this.upcomingBookings = bookings.filter(b => b.status === 'Confirmed' && new Date(b.checkInDate) > new Date());
        this.cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
        this.completedBookings = bookings.filter(b => b.status === 'Completed' || new Date(b.checkOutDate) < new Date());
      },
      error: (error) => console.error('Failed to fetch bookings:', error)
    });
    */
  }

  // Placeholder for viewing booking details
  viewDetails(bookingId: number): void {
    console.log(`View details for booking ID: ${bookingId}`);
    // TODO: Implement navigation to booking details page
  }

  // Placeholder for cancelling a booking
  cancelBooking(bookingId: number): void {
    console.log(`Cancel booking ID: ${bookingId}`);
    // TODO: Implement cancel booking logic with API call
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}