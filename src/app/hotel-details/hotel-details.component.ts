import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Hotel, HotelImage, Amenity, Room, Review } from '../models/hotel';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface BookingResponse {
  id: number;
  hotelId: number;
  customerId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  specialRequest: string;
  bookingRooms: { roomId: number }[];
}

interface DateAvailability {
  date: Date;
  available: boolean;
}

@Component({
  selector: 'app-hotel-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hotel-details.component.html',
  styleUrls: ['./hotel-details.component.css']
})
export class HotelDetailsComponent implements OnInit, OnDestroy {
  hotel: Hotel | undefined;
  reviews: Review[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  private slideshowInterval: any;
  reviewForm: FormGroup;
  bookingForm: FormGroup;
  isAuthenticated: boolean = false;
  customerName: string = 'Anonymous';
  customerId: number | null = null;
  showBookingModal: boolean = false;
  showPaymentModal: boolean = false;
  bookedDetails: BookingResponse | null = null;
  roomTypes = [
    { value: 0, label: 'Standard With Balcony' },
    { value: 1, label: 'Superior With Balcony' },
    { value: 2, label: 'Premium With Balcony' }
  ];
  unavailableDates: Date[] = [];
  minCheckInDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(500)]]
    });

    this.bookingForm = this.fb.group({
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      numberOfGuests: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      roomType: [0, Validators.required],
      specialRequest: ['']
    });
  }

  ngOnInit(): void {
    const hotelId = this.route.snapshot.paramMap.get('id');
    if (hotelId) {
      this.checkAuthentication();
      if (!this.isAuthenticated) {
        this.errorMessage = 'Please log in to view hotel details and book a room.';
        return;
      }
      this.fetchHotelDetails(+hotelId);
      this.fetchReviews(+hotelId);
      this.fetchUnavailableDates(+hotelId);
    } else {
      this.errorMessage = 'Invalid hotel ID.';
    }
  }

  ngOnDestroy(): void {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
    }
  }

  checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      const user = this.authService.getCurrentUser();
      this.customerName = user?.fullName ?? 'Anonymous';
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  private getCustomerIdFromToken(): number | null {
    const token = this.authService.getToken() || sessionStorage.getItem('token');
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      return payload.customerId || payload.id || payload.sub || null;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  fetchHotelDetails(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.http.get<Hotel>(`http://localhost:5280/api/hotels/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(error => {
        console.error('Error fetching hotel details:', error);
        this.errorMessage = 'Failed to load hotel details. Please ensure you are logged in.';
        this.isLoading = false;
        return of(null);
      }))
      .subscribe(hotel => {
        if (hotel) {
          const latitude = 20 + (Math.random() * 20 - 10);
          const longitude = 70 + (Math.random() * 20 - 10);
          this.hotel = { ...hotel, currentImageIndex: 0, latitude, longitude };
          this.startSlideshow();
        }
        this.isLoading = false;
      });
  }

  fetchReviews(hotelId: number): void {
    this.http.get<Review[]>(`http://localhost:5280/api/reviews/${hotelId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(error => {
        console.error('Error fetching reviews:', error);
        this.errorMessage = 'Failed to load reviews.';
        return of([]);
      }))
      .subscribe(reviews => this.reviews = reviews);
  }

  fetchUnavailableDates(hotelId: number): void {
    this.http.get<Room[]>(`http://localhost:5280/api/rooms/get-rooms/${hotelId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(error => {
        console.error('Error fetching rooms for availability:', error);
        this.errorMessage = 'Failed to load room availability. Please ensure you are logged in.';
        return of([]);
      }))
      .subscribe(rooms => {
        if (rooms.length === 0) {
          this.errorMessage = 'No rooms available for this hotel.';
          return;
        }
        const today = new Date();
        const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        const datesToCheck: Date[] = [];
        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
          datesToCheck.push(new Date(d));
        }
        const availabilityPromises = datesToCheck.map(date => {
          return this.http.get<Room[]>(`http://localhost:5280/api/rooms/get-rooms/${hotelId}`, { headers: this.getAuthHeaders() })
            .pipe(
              map((rooms: Room[]) => {
                const available = rooms.some(r => {
                  if (!r.type) return false;
                  return (parseInt(r.type) - 1) === this.roomTypes[0].value && r.isAvailable;
                });
                return { date, available } as DateAvailability;
              }),
              catchError(() => of({ date, available: false } as DateAvailability))
            );
        });
        Promise.all(availabilityPromises.map(p => p.toPromise())).then(results => {
          this.unavailableDates = results
            .filter((r): r is DateAvailability => r !== undefined && !r.available)
            .map(r => r.date);
          this.errorMessage = null;
        });
      });
  }

  startSlideshow(): void {
    if (this.hotel && this.hotel.images && this.hotel.images.length > 1) {
      this.slideshowInterval = setInterval(() => {
        this.hotel!.currentImageIndex = (this.hotel!.currentImageIndex! + 1) % this.hotel!.images.length;
      }, 3000);
    }
  }

  getAverageRating(): number {
    return this.reviews.length ? this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length : 0;
  }

  getRoomTypeName(type: string | undefined): string {
    if (!type) return 'Unknown Room Type';
    const typeNum = parseInt(type);
    const roomTypes: { [key: number]: string } = {
      1: 'Standard With Balcony',
      2: 'Superior With Balcony',
      3: 'Premium With Balcony'
    };
    return roomTypes[typeNum] || 'Unknown Room Type';
  }

  onSubmitReview(): void {
    if (this.reviewForm.valid && this.hotel?.id) {
      const token = this.authService.getToken();
      const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
      const reviewData = {
        hotelId: this.hotel.id,
        customerId: this.isAuthenticated ? this.customerId : null,
        rating: this.reviewForm.value.rating,
        comment: this.reviewForm.value.comment
      };
      this.http.post<Review>('http://localhost:5280/api/reviews', reviewData, { headers }).subscribe({
        next: (newReview) => {
          this.reviews.push(newReview);
          this.reviewForm.reset({ rating: 0, comment: '' });
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          this.errorMessage = `Failed to submit review. ${error.message || 'Please try again.'}`;
        }
      });
    }
  }

  bookNow(): void {
    if (!this.isAuthenticated) {
      this.errorMessage = 'Please log in to book a room.';
      return;
    }
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.bookingForm.reset({ roomType: 0, numberOfGuests: 1 });
    this.errorMessage = null;
  }

  onSubmitBooking(): void {
    console.log('onSubmitBooking called');
    if (!this.isAuthenticated) {
      this.errorMessage = 'Please log in to book a room.';
      return;
    }
    if (this.bookingForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      this.markFormGroupTouched(this.bookingForm);
      return;
    }

    const formValue = this.bookingForm.value;
    const checkInDate = new Date(formValue.checkInDate || '');
    const checkOutDate = new Date(formValue.checkOutDate || '');
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      this.errorMessage = 'Invalid date format. Please select valid dates.';
      return;
    }
    if (checkInDate >= checkOutDate) {
      this.errorMessage = 'Check-out date must be after check-in date.';
      return;
    }

    const isDateRangeAvailable = this.isDateRangeAvailable(checkInDate, checkOutDate);
    if (!isDateRangeAvailable) {
      this.errorMessage = 'Selected dates are not available. Please choose different dates.';
      return;
    }

    if (this.hotel?.id) {
      const customerId = this.getCustomerIdFromToken();
      if (!customerId) {
        this.errorMessage = 'Unable to book: Customer ID not found in token.';
        return;
      }

      const bookingData = {
        hotelId: this.hotel.id,
        roomType: formValue.roomType,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        numberOfRooms: 1,
        numberOfGuests: formValue.numberOfGuests,
        specialRequest: formValue.specialRequest || ''
      };
      const headers = this.getAuthHeaders();
      this.http.post<BookingResponse>('http://localhost:5280/api/booking/add', bookingData, { headers }).subscribe({
        next: (response) => {
          console.log('Booking Successful:', response);
          this.bookedDetails = response;
          this.showBookingModal = false;
          this.showPaymentModal = true; // Show the payment modal with booking details
          this.errorMessage = null;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creating booking:', error);
          this.errorMessage = error.error?.message || error.message || 'Failed to create booking. Please try again.';
        }
      });
    } else {
      this.errorMessage = 'Unable to book: Hotel information is missing.';
    }
  }

  isDateRangeAvailable(checkIn: Date, checkOut: Date): boolean {
    const currentDate = new Date(checkIn);
    while (currentDate <= checkOut) {
      const isUnavailable = this.unavailableDates.some(unavailable =>
        unavailable.getFullYear() === currentDate.getFullYear() &&
        unavailable.getMonth() === currentDate.getMonth() &&
        unavailable.getDate() === currentDate.getDate()
      );
      if (isUnavailable) return false;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return true;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.bookedDetails = null;
  }

  proceedToPayment(): void {
    console.log('Proceeding to payment for booking:', this.bookedDetails);
    if (this.bookedDetails?.id) {
      const token = this.authService.getToken() || sessionStorage.getItem('token');
      if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const updateData = {
          checkInDate: this.bookedDetails.checkInDate,
          checkOutDate: this.bookedDetails.checkOutDate,
          numberOfGuests: this.bookedDetails.numberOfGuests,
          specialRequest: this.bookedDetails.specialRequest || ''
        };
        this.http.put(`http://localhost:5280/api/booking/${this.bookedDetails.id}`, updateData, { headers })
          .subscribe({
            next: () => {
              console.log('Booking updated to Paid (simulated)');
              if (this.bookedDetails) this.bookedDetails.status = 'Paid';
              this.showPaymentModal = false;
              this.bookedDetails = null;
              this.router.navigate(['/my-bookings']); // Navigate to My Bookings
            },
            error: (error) => {
              console.error('Payment update failed:', error);
              this.errorMessage = 'Payment update failed. Please try again.';
            }
          });
      }
    }
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    const initials = names.map(n => n.charAt(0).toUpperCase()).join('');
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  }

  getAvatarColor(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
    return colors[name.length % colors.length];
  }

  get minCheckOutDate(): string {
    const checkInDate = this.bookingForm.get('checkInDate')?.value as string | undefined;
    return checkInDate || this.minCheckInDate;
  }
}