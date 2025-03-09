import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { AuthService } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface Booking {
  id: number;
  hotelId: number;
  customerId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  specialRequest: string;
  // Removed hotelName since it's not in the backend response
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [RouterModule, CommonModule, HeaderComponent, AuthModalsComponent],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false;
  userFullName: string | null = null;
  userInitial: string | null = null;
  private userSub: Subscription | undefined;

  activeTab: string = 'upcoming';

  upcomingBookings: Booking[] = [];
  cancelledBookings: Booking[] = [];
  completedBookings: Booking[] = [];
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userFullName = localStorage.getItem('userFullName');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    });

    this.fetchBookings();
  }

  fetchBookings(): void {
    const token = this.authService.getToken() || sessionStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      this.errorMessage = 'Authentication token not found. Please log in.';
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<Booking[]>(`http://localhost:5280/api/booking/customer`, { headers })
      .subscribe({
        next: (bookings) => {
          const now = new Date();
          this.upcomingBookings = bookings.filter(b => {
            const checkIn = new Date(b.checkInDate);
            const checkOut = new Date(b.checkOutDate);
            const status = b.status === 'Pending' ? 'Confirmed' : b.status;
            return (status === 'Confirmed' || status === 'Paid') && checkIn > now;
          });
          this.cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
          this.completedBookings = bookings.filter(b => {
            const checkOut = new Date(b.checkOutDate);
            return b.status === 'Paid' && checkOut < now;
          });
          this.errorMessage = null;
        },
        error: (error) => {
          console.error('Failed to fetch bookings:', error);
          this.errorMessage = 'Failed to load bookings. The server endpoint may not be available. Contact support if the issue persists.';
        }
      });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  viewDetails(bookingId: number): void {
    console.log(`View details for booking ID: ${bookingId}`);
    this.router.navigate(['/booking-details', bookingId]);
  }

  cancelBooking(bookingId: number): void {
    console.log(`Cancel booking ID: ${bookingId}`);
    const token = this.authService.getToken() || sessionStorage.getItem('token');
    if (token && bookingId) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.delete(`http://localhost:5280/api/booking/${bookingId}`, { headers })
        .subscribe({
          next: () => {
            this.fetchBookings();
          },
          error: (error) => {
            console.error('Failed to cancel booking:', error);
            this.errorMessage = 'Failed to cancel booking. Please try again.';
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }
}