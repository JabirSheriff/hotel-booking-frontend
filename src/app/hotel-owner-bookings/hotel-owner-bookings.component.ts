import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotelService } from '../services/hotel.service';
import { forkJoin } from 'rxjs';

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
  customer?: { fullName: string; email: string };
}

interface BookingRoom {
  bookingId: number;
  roomId: number;
  room?: { type: string; pricePerNight: number };
}

interface Payment {
  id: number;
  bookingId: number;
  customerId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

@Component({
  selector: 'app-hotel-owner-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-owner-bookings.component.html',
  styleUrls: ['./hotel-owner-bookings.component.css']
})
export class HotelOwnerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  payments: Payment[] = [];
  filteredBookings: Booking[] = [];
  selectedBooking: Booking | null = null;
  selectedPayment: Payment | null = null;
  showPaidOnly: boolean = false;

  constructor(private hotelService: HotelService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log('Initializing HotelOwnerBookingsComponent');
    this.loadData();
  }

  loadData() {
    forkJoin({
      bookings: this.hotelService.getBookingsByOwner(),
      payments: this.hotelService.getPaidBookings()
    }).subscribe({
      next: ({ bookings, payments }) => {
        this.bookings = bookings;
        this.payments = payments;
        this.filteredBookings = [...bookings]; // Initialize with all bookings
        console.log('Bookings Loaded:', this.bookings);
        console.log('Payments Loaded:', this.payments);
        console.log('Initial Filtered Bookings:', this.filteredBookings);
        this.cdr.detectChanges(); // Force UI update
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.cdr.detectChanges();
      }
    });
  }

  filterBookings() {
    console.log('Filtering bookings, showPaidOnly:', this.showPaidOnly);
    console.log('Bookings before filter:', this.bookings);
    console.log('Payments for filter:', this.payments);
    this.filteredBookings = this.showPaidOnly
      ? this.bookings.filter(b => this.payments.some(p => p.bookingId === b.id))
      : [...this.bookings]; // Use spread to create new array
    console.log('Filtered Bookings:', this.filteredBookings);
    this.cdr.detectChanges(); // Force UI update
  }

  toggleFilter() {
    this.showPaidOnly = !this.showPaidOnly;
    this.filterBookings();
  }

  showDetails(booking: Booking) {
    this.selectedBooking = booking;
    this.selectedPayment = this.payments.find(p => p.bookingId === booking.id) || null;
    this.cdr.detectChanges(); // Ensure popup reflects data
  }

  closePopup() {
    this.selectedBooking = null;
    this.selectedPayment = null;
    this.cdr.detectChanges();
  }

  getStatus(booking: Booking): string {
    return this.payments.some(p => p.bookingId === booking.id) ? 'Paid' : 'Booked but Not Paid';
  }

  getRoomIds(booking: Booking): string {
    return booking.bookingRooms.map(br => br.roomId).join(', ');
  }
}