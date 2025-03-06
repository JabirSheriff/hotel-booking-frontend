import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

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
  imageUrl?: string;
  isRandom?: boolean;
  avgPrice?: number;
  reviews: ReviewResponse[];
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
  room?: Room;
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

@Injectable({ providedIn: 'root' })
export class HotelService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    console.log('Auth Token:', token); // Debug token
    if (!token) {
      console.warn('No auth token found in localStorage');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getHotelsByOwner(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(`${environment.apiUrl}/hotels/by-owner`, { headers: this.getHeaders() });
  }

  getAllHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(`${environment.apiUrl}/hotels/all`, { headers: this.getHeaders() });
  }

  addHotel(hotel: any): Observable<Hotel> {
    return this.http.post<Hotel>(`${environment.apiUrl}/hotels/add`, hotel, { headers: this.getHeaders() });
  }

  updateHotel(hotelId: number, patchDoc: any): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/hotels/${hotelId}`, patchDoc, { headers: this.getHeaders() });
  }

  deleteHotel(hotelId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/hotels/${hotelId}`, { headers: this.getHeaders() });
  }

  bookHotel(bookingData: { hotelId: number; roomType: number; checkInDate: string; checkOutDate: string; numberOfRooms: number; numberOfGuests: number; specialRequest?: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/booking/add`, bookingData, { headers: this.getHeaders() });
  }

  getBooking(bookingId: number): Observable<Booking> {
    return this.http.get<Booking>(`${environment.apiUrl}/booking/${bookingId}`, { headers: this.getHeaders() });
  }

  getCustomerBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${environment.apiUrl}/booking/customer`, { headers: this.getHeaders() });
  }

  updateBooking(bookingId: number, checkInDate: string, checkOutDate: string, numberOfGuests: number, specialRequest?: string): Observable<any> {
    const data = { checkInDate, checkOutDate, numberOfGuests, specialRequest };
    return this.http.put(`${environment.apiUrl}/booking/${bookingId}`, data, { headers: this.getHeaders() });
  }

  deleteBooking(bookingId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/booking/${bookingId}`, { headers: this.getHeaders() });
  }

  processPayment(bookingId: number, paymentMethod: string): Observable<any> {
    const paymentData = { bookingId, paymentMethod };
    return this.http.post(`${environment.apiUrl}/payments/process-payment`, paymentData, { headers: this.getHeaders() });
  }

  getPaidBookings(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${environment.apiUrl}/payments/paid-bookings`, { headers: this.getHeaders() });
  }

  getUnpaidBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/payments/unpaid-bookings`, { headers: this.getHeaders() });
  }

  addReview(reviewData: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${environment.apiUrl}/reviews`, reviewData, { headers: this.getHeaders() });
  }

  getReviewsByHotelId(hotelId: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${environment.apiUrl}/reviews/${hotelId}`, { headers: this.getHeaders() });
  }

  updateReview(reviewId: number, reviewData: ReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${environment.apiUrl}/reviews/${reviewId}`, reviewData, { headers: this.getHeaders() });
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${reviewId}`, { headers: this.getHeaders() });
  }

  getBookingsByOwner(): Observable<Booking[]> {
    const headers = this.getHeaders();
    console.log('Requesting owner bookings with Authorization:', headers.get('Authorization'));
    return this.http.get<Booking[]>(`${environment.apiUrl}/hotels/bookings`, { headers }).pipe(
      catchError(error => {
        console.error('Error in getBookingsByOwner:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch owner bookings'));
      })
    );
  }
}