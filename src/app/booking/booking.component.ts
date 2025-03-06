import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HotelService } from '../services/hotel.service';

interface BookingForm {
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfGuests: number;
  roomType: number;
  specialRequest?: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  hotelId: number | null = null;
  hotel: any = null;
  bookingForm: BookingForm = {
    hotelId: 0,
    checkInDate: '',
    checkOutDate: '',
    numberOfRooms: 1,
    numberOfGuests: 1,
    roomType: 0,
    specialRequest: ''
  };
  errorMessage: string = '';
  successMessage: string = '';
  roomTypes = [
    { id: 0, name: 'Single' },
    { id: 1, name: 'Double' },
    { id: 2, name: 'Suite' },
    { id: 3, name: 'Deluxe' }
  ];

  constructor(
    private hotelService: HotelService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.hotelId = +this.route.snapshot.paramMap.get('hotelId')!;
    this.bookingForm.hotelId = this.hotelId;
    this.loadHotelDetails();
  }

  loadHotelDetails() {
    this.hotelService.getAllHotels().subscribe({
      next: (hotels) => {
        this.hotel = hotels.find(h => h.id === this.hotelId);
        if (!this.hotel) this.errorMessage = 'Hotel not found.';
      },
      error: (error) => {
        this.errorMessage = 'Failed to load hotel details.';
        console.error(error);
      }
    });
  }

  saveBooking() {
    if (!this.bookingForm.checkInDate || !this.bookingForm.checkOutDate || 
        this.bookingForm.numberOfRooms < 1 || this.bookingForm.numberOfGuests < 1) {
      this.errorMessage = 'Please fill in all fields correctly.';
      return;
    }

    if (new Date(this.bookingForm.checkInDate) >= new Date(this.bookingForm.checkOutDate)) {
      this.errorMessage = 'Check-out date must be after check-in date.';
      return;
    }

    const savedBookings = JSON.parse(localStorage.getItem('savedBookings') || '[]');
    savedBookings.push({ ...this.bookingForm });
    localStorage.setItem('savedBookings', JSON.stringify(savedBookings));
    this.successMessage = 'Booking saved! Redirecting...';
    this.errorMessage = '';
    this.resetForm();
    setTimeout(() => this.router.navigate(['/customer-dashboard']), 2000);
  }

  bookNow() {
    if (!this.bookingForm.checkInDate || !this.bookingForm.checkOutDate || 
        this.bookingForm.numberOfRooms < 1 || this.bookingForm.numberOfGuests < 1) {
      this.errorMessage = 'Please fill in all fields correctly.';
      return;
    }

    if (new Date(this.bookingForm.checkInDate) >= new Date(this.bookingForm.checkOutDate)) {
      this.errorMessage = 'Check-out date must be after check-in date.';
      return;
    }

    const bookingData = {
      hotelId: this.bookingForm.hotelId,
      roomType: this.bookingForm.roomType,
      checkInDate: this.bookingForm.checkInDate,
      checkOutDate: this.bookingForm.checkOutDate,
      numberOfRooms: this.bookingForm.numberOfRooms,
      numberOfGuests: this.bookingForm.numberOfGuests,
      specialRequest: this.bookingForm.specialRequest || undefined
    };

    console.log('Booking Data:', bookingData);

    this.hotelService.bookHotel(bookingData).subscribe({
      next: (response) => {
        console.log('Booking Success:', response);
        this.successMessage = 'Booking successful! Redirecting...';
        this.errorMessage = '';
        setTimeout(() => this.router.navigate(['/customer-dashboard']), 2000);
      },
      error: (error) => {
        console.error('Booking Error:', error);
        this.errorMessage = error.error ?? 'Booking failed.';
      }
    });
  }

  resetForm() {
    this.bookingForm = {
      hotelId: this.hotelId || 0,
      checkInDate: '',
      checkOutDate: '',
      numberOfRooms: 1,
      numberOfGuests: 1,
      roomType: 0,
      specialRequest: ''
    };
  }
}