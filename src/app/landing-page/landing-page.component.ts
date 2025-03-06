import { Component, OnInit, OnDestroy, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { HeaderComponent } from '../header/header.component';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    HeaderComponent,
    AuthModalsComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  isContentLoading: boolean = true;
  isModalOpen: boolean = false; // Track modal visibility

  searchLocation: string = 'Goa, India';
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
    { name: 'Bangalore', icon: 'bangalore.png' },
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
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
    this.checkInDate = '2025-03-06';
    this.checkOutDate = '2025-03-14';
    this.updateCheckOutMinDate();

    setTimeout(() => {
      this.isContentLoading = false;
    }, 2000);
  }

  ngAfterViewInit(): void {
    this.calculateCityPositions();
    this.cityButtons.changes.subscribe(() => {
      this.calculateCityPositions();
    });
    if (this.selectedCityIndex !== null) {
      this.updateUnderline();
    }
  }

  // Handle modal visibility changes
  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  calculateCityPositions(): void {
    const buttons = this.cityButtons.toArray();
    this.cityPositions = buttons.map(() => 0);
    if (this.selectedCityIndex !== null) {
      this.updateUnderline();
    }
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
    if (newRooms >= 1) {
      this.rooms = newRooms;
    }
  }

  updateAdults(change: number): void {
    const newAdults = this.adults + change;
    if (newAdults >= 1) {
      this.adults = newAdults;
    }
  }

  updateKids(change: number): void {
    const newKids = this.kids + change;
    if (newKids >= 0) {
      this.kids = newKids;
    }
  }

  onLocationInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length > 2) {
      this.locationSuggestions = [
        'Goa, India',
        'Mumbai, India',
        'Delhi, India',
        'Bangalore, India',
      ].filter(suggestion => suggestion.toLowerCase().includes(input.toLowerCase()));
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
  }

  togglePricePerNightDropdown(): void {
    this.showPricePerNightDropdown = !this.showPricePerNightDropdown;
  }

  selectPricePerNight(pricePerNight: string): void {
    this.selectedPricePerNight = pricePerNight;
    this.showPricePerNightDropdown = false;
  }

  onSearch(): void {
    let params = new HttpParams();

    if (this.searchLocation) {
      params = params.set('searchTerm', this.searchLocation);
    }
    if (this.checkInDate) {
      params = params.set('checkInDate', this.checkInDate);
    }
    if (this.checkOutDate) {
      params = params.set('checkOutDate', this.checkOutDate);
    }
    params = params.set('numberOfGuests', (this.adults + this.kids).toString());
    params = params.set('numberOfRooms', this.rooms.toString());

    const maxPricePerNight = this.selectedPricePerNight === 'Any' ? null : this.getPricePerNightValue(this.selectedPricePerNight, 'max');
    if (maxPricePerNight !== null) {
      params = params.set('maxPricePerNight', maxPricePerNight.toString());
    }

    this.http.get<any[]>('http://localhost:5280/api/hotels/search', { params })
      .subscribe({
        next: (hotels) => {
          console.log('Hotels found:', hotels);
        },
        error: (error) => {
          console.error('Error searching hotels:', error);
        }
      });
  }

  private getPricePerNightValue(pricePerNight: string, type: 'max'): number | null {
    switch (pricePerNight) {
      case '0-1500':
        return 1500;
      case '1500-2500':
        return 2500;
      case '2500-5000':
        return 5000;
      case '5000+':
        return null;
      default:
        return null;
    }
  }

  onImageError(event: Event, cityName: string): void {
    console.error(`Failed to load icon for ${cityName}:`, (event.target as HTMLImageElement).src);
  }

  onImageLoad(event: Event, cityName: string): void {
    console.log(`Successfully loaded icon for ${cityName}:`, (event.target as HTMLImageElement).src);
  }

  ngOnDestroy(): void {
    // No subscriptions to clean up
  }
}