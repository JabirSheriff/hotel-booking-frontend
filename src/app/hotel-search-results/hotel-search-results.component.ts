// src/app/hotel-search-results/hotel-search-results.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { SearchService } from '../services/search.service';
import { HotelDataService } from '../services/hotel-data.service';
import { Hotel } from '../models/hotel';

@Component({
  selector: 'app-hotel-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, AuthModalsComponent],
  templateUrl: './hotel-search-results.component.html',
  styleUrls: ['./hotel-search-results.component.css']
})
export class HotelSearchResultsComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false;
  hotels: Hotel[] = [];
  isHotelsLoading: boolean = false;
  isCardLoading: boolean = false;
  private slideshowIntervals: any[] = [];

  searchLocation: string = '';
  checkInDate: string = '';
  checkOutDate: string = '';
  checkOutMinDate: string = '';
  rooms: number = 1;
  adults: number = 2;
  kids: number = 0;
  showGuestsDropdown: boolean = false;
  locationSuggestions: string[] = [];
  today: string = '';

  pricePerNightRanges: string[] = ['Any', '0-1500', '1500-2500', '2500-5000', '5000+'];
  selectedPricePerNight: string = 'Any';
  showPricePerNightDropdown: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private searchService: SearchService,
    private hotelDataService: HotelDataService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    const params = this.searchService.getSearchParams();
    if (params) {
      this.searchLocation = params.searchLocation;
      this.checkInDate = params.checkInDate;
      this.checkOutDate = params.checkOutDate;
      this.rooms = params.rooms;
      this.adults = params.adults;
      this.kids = params.kids;
      this.selectedPricePerNight = params.selectedPricePerNight;
      this.updateCheckOutMinDate();
    }
    this.hotels = this.hotelDataService.getHotels();
    this.startSlideshows();
  }

  ngOnDestroy(): void {
    this.slideshowIntervals.forEach(interval => clearInterval(interval));
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  updateCheckOutMinDate(): void {
    if (this.checkInDate) {
      const checkIn = new Date(this.checkInDate);
      checkIn.setDate(checkIn.getDate() + 1);
      this.checkOutMinDate = checkIn.toISOString().split('T')[0];
      if (new Date(this.checkOutDate) <= new Date(this.checkInDate)) {
        this.checkOutDate = this.checkOutMinDate;
      }
    }
  }

  toggleGuestsDropdown(): void {
    this.showGuestsDropdown = !this.showGuestsDropdown;
  }

  updateRooms(change: number): void {
    const newRooms = this.rooms + change;
    if (newRooms >= 1) this.rooms = newRooms;
  }

  updateAdults(change: number): void {
    const newAdults = this.adults + change;
    if (newAdults >= 1) this.adults = newAdults;
  }

  updateKids(change: number): void {
    const newKids = this.kids + change;
    if (newKids >= 0) this.kids = newKids;
  }

  onLocationInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length > 2) {
      this.locationSuggestions = ['Goa, India', 'Mumbai, India', 'Delhi, India', 'Bengaluru, India']
        .filter(suggestion => suggestion.toLowerCase().includes(input.toLowerCase()));
    } else {
      this.locationSuggestions = [];
    }
  }

  selectLocation(suggestion: string): void {
    this.searchLocation = suggestion;
    this.locationSuggestions = [];
  }

  togglePricePerNightDropdown(): void {
    this.showPricePerNightDropdown = !this.showPricePerNightDropdown;
  }

  selectPricePerNight(pricePerNight: string): void {
    this.selectedPricePerNight = pricePerNight;
    this.showPricePerNightDropdown = false;
  }

  onSearch(): void {
    this.isHotelsLoading = true;
    this.hotels = [];
    this.isCardLoading = true;
    let params = new HttpParams();

    if (this.searchLocation) params = params.set('searchTerm', this.searchLocation);
    if (this.checkInDate) params = params.set('checkInDate', this.checkInDate);
    if (this.checkOutDate) params = params.set('checkOutDate', this.checkOutDate);
    params = params.set('numberOfGuests', (this.adults + this.kids).toString());
    params = params.set('numberOfRooms', this.rooms.toString());

    const maxPrice = this.selectedPricePerNight === 'Any' ? null : this.getPricePerNightValue(this.selectedPricePerNight, 'max');
    if (maxPrice !== null) params = params.set('maxPrice', maxPrice.toString());

    this.http.get<Hotel[]>('http://localhost:5280/api/hotels/search', { params })
      .subscribe({
        next: (hotels) => {
          this.hotels = hotels.map(hotel => ({
            ...hotel,
            imageUrl: hotel.images.find(img => img.isPrimary)?.imageUrl || 'https://via.placeholder.com/300x200',
            location: `${hotel.city}, ${hotel.country}`,
            pricePerNight: Math.min(...hotel.rooms.map(room => room.pricePerNight)),
            originalPrice: Math.min(...hotel.rooms.map(room => room.pricePerNight)) * 1.5,
            rating: 4.2,
            ratingCount: 803,
            description: hotel.description || 'Conveniently located near key landmarks, clean rooms, tasty food',
            currentImageIndex: 0
          }));
          this.hotelDataService.setHotels(this.hotels);
          this.isHotelsLoading = false;
          this.isCardLoading = false;
          this.startSlideshows();
        },
        error: (error) => {
          console.error('Error searching hotels:', error);
          this.isHotelsLoading = false;
          this.isCardLoading = false;
          alert('Failed to load hotels. Please try again.');
        }
      });
  }

  private getPricePerNightValue(pricePerNight: string, type: 'max'): number | null {
    switch (pricePerNight) {
      case '0-1500': return 1500;
      case '1500-2500': return 2500;
      case '2500-5000': return 5000;
      case '5000+': return null;
      default: return null;
    }
  }

  goToDetails(hotelId: number): void {
    this.router.navigate(['/hotel-details', hotelId]);
  }
  private startSlideshows(): void {
    this.slideshowIntervals.forEach(interval => clearInterval(interval));
    this.slideshowIntervals = [];
    this.hotels.forEach(hotel => {
      const interval = setInterval(() => {
        hotel.currentImageIndex = (hotel.currentImageIndex! + 1) % hotel.images.length;
      }, 3000);
      this.slideshowIntervals.push(interval);
    });
  }

  onImageError(event: Event, name: string): void {
    console.error(`Failed to load image for ${name}:`, (event.target as HTMLImageElement).src);
    (event.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200';
  }

  onImageLoad(event: Event, name: string): void {
    console.log(`Successfully loaded image for ${name}:`, (event.target as HTMLImageElement).src);
  }
}