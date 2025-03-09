import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel'; // Import the shared interface

@Injectable({
  providedIn: 'root'
})
export class HotelDataService {
  private hotels: Hotel[] = [];

  setHotels(hotels: Hotel[]): void {
    this.hotels = hotels;
  }

  getHotels(): Hotel[] {
    return this.hotels;
  }

  clearHotels(): void {
    this.hotels = [];
  }
}