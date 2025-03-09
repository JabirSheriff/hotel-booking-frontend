import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { HotelDataService } from '../services/hotel-data.service';
import { Hotel } from '../models/hotel'; // Import the shared interface

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, AuthModalsComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  isContentLoading: boolean = true;
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

  cities = [
    { name: 'Bengaluru', icon: 'bangalore.png' },
    { name: 'Chennai', icon: 'chennai.png' },
    { name: 'Mumbai', icon: 'mumbai.png' },
    { name: 'Hyderabad', icon: 'hyderabad.png' },
    { name: 'Kolkata', icon: 'kolkata.png' },
    { name: 'Bhubaneswar', icon: 'odisha.png' },
  ];

  selectedCityIndex: number | null = null;
  cityPositions: number[] = [];
  underlineWidth: number = 0;
  underlinePosition: number = 0;
  @ViewChildren('cityButton') cityButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  pricePerNightRanges: string[] = ['Any', '0-1500', '1500-2500', '2500-5000', '5000+'];
  selectedPricePerNight: string = 'Any';
  showPricePerNightDropdown: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private hotelDataService: HotelDataService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.hotelDataService.getHotels().length > 0) {
          this.hotels = [...this.hotelDataService.getHotels()];
          this.startSlideshows();
        }
      }
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.checkInDate = new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0];
    this.checkOutDate = new Date(today.setDate(today.getDate() + 8)).toISOString().split('T')[0];
    this.updateCheckOutMinDate();

    const storedHotels = this.hotelDataService.getHotels();
    if (storedHotels.length > 0) {
      this.hotels = [...storedHotels];
      this.startSlideshows();
    }

    setTimeout(() => {
      this.isContentLoading = false;
    }, 2000);
  }

  ngAfterViewInit(): void {
    this.calculateCityPositions();
    this.cityButtons.changes.subscribe(() => this.calculateCityPositions());
    if (this.selectedCityIndex !== null) this.updateUnderline();
  }

  ngOnDestroy(): void {
    this.slideshowIntervals.forEach(interval => clearInterval(interval));
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  calculateCityPositions(): void {
    const buttons = this.cityButtons.toArray();
    this.cityPositions = buttons.map(() => 0);
    if (this.selectedCityIndex !== null) this.updateUnderline();
  }

  updateUnderline(): void {
    if (this.selectedCityIndex !== null) {
      const buttons = this.cityButtons.toArray();
      this.underlineWidth = buttons[this.selectedCityIndex]?.nativeElement.offsetWidth || 0;
      this.underlinePosition = 0;
    } else {
      this.underlineWidth = 0;
      this.underlinePosition = 0;
    }
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

  selectCity(index: number): void {
    this.selectedCityIndex = index;
    this.calculateCityPositions();
    this.updateUnderline();
    this.selectLocation(this.cities[index].name);
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

    console.log('Search Params:', {
      searchTerm: this.searchLocation,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      numberOfGuests: this.adults + this.kids,
      numberOfRooms: this.rooms,
      maxPrice
    });

    this.http.get<Hotel[]>('http://localhost:5280/api/hotels/search', { params })
      .subscribe({
        next: (hotels) => {
          this.hotels = hotels.map(hotel => {
            const primaryImage = hotel.images.find(img => img.isPrimary)?.imageUrl || 'https://via.placeholder.com/300x200';
            const lowestPrice = Math.min(...hotel.rooms.map(room => room.pricePerNight));
            return {
              ...hotel,
              imageUrl: primaryImage,
              location: `${hotel.city}, ${hotel.country}`,
              pricePerNight: lowestPrice,
              originalPrice: lowestPrice * 1.5,
              rating: 4.2,
              ratingCount: 803,
              description: hotel.description || 'Conveniently located near key landmarks, clean rooms, tasty food',
              currentImageIndex: 0
            };
          });
          this.hotelDataService.setHotels(this.hotels);
          this.isHotelsLoading = false;
          this.isCardLoading = false;
          this.startSlideshows();
          console.log('Hotels found:', this.hotels);
        },
        error: (error) => {
          console.error('Error searching hotels:', error);
          this.isHotelsLoading = false;
          this.isCardLoading = false;
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
    window.open(`/hotel/${hotelId}`, '_blank');
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