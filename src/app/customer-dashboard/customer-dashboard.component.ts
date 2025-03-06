import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../services/hotel.service';
import { ChangeDetectorRef } from '@angular/core';

interface BookingForm {
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfGuests: number;
  roomType: number;
  specialRequest?: string;
}

interface Booking {
  id: number;
  hotelId: number;
  customerId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  specialRequest?: string;
  bookingRooms: BookingRoom[];
  selectedPaymentMethod?: string;
}

interface Room {
  id: number;
  roomNumber: string;
  type: string;
  description: string;
  pricePerNight: number;
  isAvailable: boolean;
  capacity: number;
  hotelId: number;
}

interface BookingRoom {
  bookingId: number;
  roomId: number;
  room?: { type: string; pricePerNight: number };
}

interface ReviewRequest {
  hotelId: number;
  rating: number;
  comment: string;
}

interface ReviewResponse {
  reviewId: number;
  hotelId: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Hotel {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating?: number;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
  hotelOwnerId: number;
  rooms: Room[];
  reviews: ReviewResponse[];
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  userEmail: string | null = null;
  userRole: string | null = null;
  showTooltip: boolean = false;
  bookings: Booking[] = [];
  savedBookings: BookingForm[] = [];
  editingBooking: BookingForm | null = null;
  paymentMethods = [
    { value: 'CreditCard', label: 'Credit Card' },
    { value: 'DebitCard', label: 'Debit Card' },
    { value: 'BankTransfer', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'PayPal', label: 'PayPal' }
  ];
  roomTypes = [
    { id: 0, name: 'Single' },
    { id: 1, name: 'Double' },
    { id: 2, name: 'Suite' },
    { id: 3, name: 'Deluxe' }
  ];
  hotels: Hotel[] = [];
  editingReview: ReviewResponse | null = null;

  constructor(private hotelService: HotelService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.userEmail = localStorage.getItem('userEmail');
    this.userRole = localStorage.getItem('userRole');
    if (!this.userEmail || this.userRole !== 'Customer') {
      this.router.navigate(['/']);
      return;
    }
    this.loadCustomerData();
    this.loadSavedBookings();
    this.loadReviewedHotels();
  }

  loadCustomerData() {
    this.hotelService.getCustomerBookings().subscribe({
      next: (bookings) => {
        console.log('Raw Bookings from API:', bookings);
        const paidBookingIds = JSON.parse(localStorage.getItem('paidBookingIds') || '[]');
        this.bookings = bookings.map(booking => {
          const isPaid = paidBookingIds.includes(booking.id) || booking.status === '1';
          const finalStatus = isPaid ? 'Paid' : 'Pending';
          return {
            ...booking,
            status: finalStatus,
            selectedPaymentMethod: isPaid ? undefined : 'CreditCard'
          };
        });
        console.log('Processed Bookings:', this.bookings);
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error loading bookings:', error)
    });
  }

  loadSavedBookings() {
    const saved = localStorage.getItem('savedBookings');
    this.savedBookings = saved ? JSON.parse(saved) : [];
  }

  loadReviewedHotels() {
    this.hotelService.getAllHotels().subscribe({
      next: (hotels: Hotel[]) => {
        console.log('Hotels from backend:', hotels); // Log raw data
        this.hotels = hotels.filter(hotel => 
          hotel.reviews.some(review => review.customerName === this.userEmail || review.customerName === 'Anonymous') // Match email or anonymous
        );
        console.log('Filtered Reviewed Hotels:', this.hotels);
      },
      error: (error) => console.error('Error loading reviewed hotels:', error)
    });
  }

  saveEditedBooking() {
    if (!this.editingBooking) return;

    if (!this.editingBooking.checkInDate || !this.editingBooking.checkOutDate || 
        this.editingBooking.numberOfRooms < 1 || this.editingBooking.numberOfGuests < 1) {
      alert('Please fill in all fields correctly.');
      return;
    }

    if (new Date(this.editingBooking.checkInDate) >= new Date(this.editingBooking.checkOutDate)) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    const index = this.savedBookings.findIndex(b => 
      b.hotelId === this.editingBooking!.hotelId &&
      b.checkInDate === this.editingBooking!.checkInDate &&
      b.checkOutDate === this.editingBooking!.checkOutDate
    );
    if (index !== -1) {
      this.savedBookings[index] = { ...this.editingBooking };
    } else {
      this.savedBookings.push({ ...this.editingBooking });
    }
    localStorage.setItem('savedBookings', JSON.stringify(this.savedBookings));
    this.editingBooking = null;
  }

  bookSavedBooking(saved: BookingForm) {
    const bookingData = {
      hotelId: saved.hotelId,
      roomType: saved.roomType,
      checkInDate: saved.checkInDate,
      checkOutDate: saved.checkOutDate,
      numberOfRooms: saved.numberOfRooms,
      numberOfGuests: saved.numberOfGuests,
      specialRequest: saved.specialRequest || undefined
    };

    this.hotelService.bookHotel(bookingData).subscribe({
      next: (response) => {
        console.log('Booking Success:', response);
        this.savedBookings = this.savedBookings.filter(b => b !== saved);
        localStorage.setItem('savedBookings', JSON.stringify(this.savedBookings));
        this.loadCustomerData();
      },
      error: (error) => {
        console.error('Booking Error:', error);
        alert('Booking failed: ' + (error.error?.message || 'Try again later'));
      }
    });
  }

  editSavedBooking(saved: BookingForm) {
    this.editingBooking = { ...saved };
  }

  editReview(review: ReviewResponse) {
    this.editingReview = { ...review };
  }

  saveReview(hotel: Hotel) {
    if (!this.editingReview || !this.editingReview.comment.trim()) return;
    const index = hotel.reviews.findIndex(r => r.reviewId === this.editingReview!.reviewId);
    if (index !== -1) {
      const reviewRequest: ReviewRequest = {
        hotelId: this.editingReview.hotelId,
        rating: this.editingReview.rating,
        comment: this.editingReview.comment
      };
      this.hotelService.updateReview(this.editingReview.reviewId, reviewRequest).subscribe({
        next: (updatedReview: ReviewResponse) => {
          hotel.reviews[index] = updatedReview;
          this.editingReview = null;
          this.updateReviewedHotels();
          console.log('Updated Review:', updatedReview);
        },
        error: (error) => {
          console.error('Error updating review:', error);
          alert('Failed to update review: ' + (error.error?.message || 'Please try again.'));
        }
      });
    }
  }

  removeReview(hotel: Hotel, reviewId: number) {
    this.hotelService.deleteReview(reviewId).subscribe({
      next: () => {
        hotel.reviews = hotel.reviews.filter(r => r.reviewId !== reviewId);
        this.updateReviewedHotels();
        console.log('Deleted Review ID:', reviewId);
      },
      error: (error) => {
        console.error('Error deleting review:', error);
        alert('Failed to delete review: ' + (error.error?.message || 'Please try again.'));
      }
    });
  }

  updateReviewedHotels() {
    this.loadReviewedHotels();
  }

  getUserInitials(): string {
    if (!this.userEmail) return '??';
    const name = this.userEmail.split('@')[0];
    return name.split('.').map((part: string) => part.charAt(0).toUpperCase()).join('') || '??';
  }

  toggleTooltip() {
    this.showTooltip = !this.showTooltip;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('paidBookingIds');
    this.router.navigate(['/']);
  }

  getRoomIds(booking: Booking): string {
    return booking.bookingRooms.map(br => br.roomId).join(', ');
  }

  payNow(booking: Booking) {
    if (booking.status === 'Paid' || !booking.selectedPaymentMethod) return;

    this.hotelService.processPayment(booking.id, booking.selectedPaymentMethod).subscribe({
      next: (response) => {
        console.log('Payment Success:', response);
        booking.status = 'Paid';
        const paidBookingIds = JSON.parse(localStorage.getItem('paidBookingIds') || '[]');
        if (!paidBookingIds.includes(booking.id)) {
          paidBookingIds.push(booking.id);
          localStorage.setItem('paidBookingIds', JSON.stringify(paidBookingIds));
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Payment Error:', error);
        alert('Payment failed: ' + (error.error?.message || 'Try again later'));
      }
    });
  }
}