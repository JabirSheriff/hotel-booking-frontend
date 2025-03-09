import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Booking, Hotel, RawBooking } from '../services/auth.service'

@Component({
  selector: 'app-hotel-owner-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AuthModalsComponent],
  templateUrl: './hotel-owner-bookings.component.html',
  styleUrls: ['./hotel-owner-bookings.component.css']
})
export class HotelOwnerBookingsComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  hotels: Hotel[] = [];
  selectedHotelIds: number[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  statusFilter: 'Pending' | 'Paid' | 'Cancelled' | 'All' = 'All';
  expandedBookingId: number | null = null;
  isModalOpen: boolean = false;
  userFullName: string | null = null;
  userInitial: string | null = null;
  showUserDropdown: boolean = false;
  showFilters: boolean = false;
  private userSub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private locationStrategy: LocationStrategy
  ) {}

  ngOnInit(): void {
    this.userFullName = sessionStorage.getItem('userFullName');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    });

    this.fetchBookings();

    this.locationStrategy.replaceState(null, '', '/hotel-owner-dashboard/bookings', '');
    this.locationStrategy.pushState(null, '', '/hotel-owner-dashboard/bookings', '');
  }

  fetchBookings(): void {
    this.isLoading = true;
    const hotelIds = this.selectedHotelIds.length ? this.selectedHotelIds : undefined;
    this.authService.getBookingsForOwner(hotelIds).subscribe({
      next: (response) => {
        this.hotels = response.hotels;
        this.bookings = response.bookings.map(booking => ({
          ...booking,
          status: this.mapStatus(booking.status),
          roomsBooked: booking.roomsBooked.map(room => ({
            ...room,
            roomType: this.mapRoomType(room.roomType)
          }))
        })) || [];
        this.filteredBookings = [...this.bookings];
        this.filterBookings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching bookings:', error);
        this.isLoading = false;
      }
    });
  }

  private mapStatus(status: number): 'Pending' | 'Paid' | 'Cancelled' {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Paid';
      case 2: return 'Cancelled';
      default: throw new Error(`Unknown status value: ${status}`);
    }
  }

  private mapRoomType(roomType: number): string {
    switch (roomType) {
      case 0: return 'StandardWithBalcony';
      case 1: return 'SuperiorWithBalcony';
      case 2: return 'PremiumWithBalcony';
      default: throw new Error(`Unknown room type value: ${roomType}`);
    }
  }

  filterBookings(): void {
    let filtered = [...this.bookings];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        booking =>
          booking.hotelName.toLowerCase().includes(term) ||
          (booking.customerName?.toLowerCase().includes(term) ?? false)
      );
    }

    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(booking => booking.status === this.statusFilter);
    }

    this.filteredBookings = filtered;
  }

  onHotelCheckboxChange(hotelId: number, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedHotelIds.push(hotelId);
    } else {
      this.selectedHotelIds = this.selectedHotelIds.filter(id => id !== hotelId);
    }
    this.fetchBookings();
  }

  onSearchChange(): void {
    this.filterBookings();
  }

  onStatusFilterChange(): void {
    this.filterBookings();
  }

  toggleBookingDetails(bookingId: number): void {
    this.expandedBookingId = this.expandedBookingId === bookingId ? null : bookingId;
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
    this.router.navigate(['/login']);
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    if (this.authService.isLoggedIn() && this.authService.getUserRole() === 'HotelOwner') {
      this.locationStrategy.pushState(null, '', '/hotel-owner-dashboard/bookings', '');
      this.router.navigate(['/hotel-owner-dashboard/bookings'], { replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}