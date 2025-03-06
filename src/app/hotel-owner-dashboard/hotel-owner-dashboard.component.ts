import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface Hotel {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  description: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  hotelOwnerId: number;
  images?: { imageUrl: string; isPrimary: boolean }[];
  amenities?: { name: string }[];
  rooms?: { roomNumber: string; type: string; description: string; pricePerNight: number; isAvailable: boolean; capacity: number }[];
}

@Component({
  selector: 'app-hotel-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AuthModalsComponent,
    FormsModule
  ],
  templateUrl: './hotel-owner-dashboard.component.html',
  styleUrls: ['./hotel-owner-dashboard.component.css']
})
export class HotelOwnerDashboardComponent implements OnInit, OnDestroy {
  isModalOpen: boolean = false;
  userFullName: string | null = null;
  userInitial: string | null = null;
  showUserDropdown: boolean = false;
  hotels: Hotel[] = [];
  filteredHotels: Hotel[] = [];
  currentPage: number = 1;
  hotelsPerPage: number = 5;
  totalPages: number = 1;
  paginatedHotels: Hotel[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  private userSub: Subscription | undefined;
  private hotelsSub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private locationStrategy: LocationStrategy
  ) {}

  ngOnInit(): void {
    this.userFullName = sessionStorage.getItem('userFullName'); // Use sessionStorage
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    this.userSub = this.authService.user$.subscribe(user => {
      this.userFullName = user ? user.fullName : null;
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    });

    this.fetchHotels();

    this.locationStrategy.replaceState(null, '', '/hotel-owner-dashboard', '');
    this.locationStrategy.pushState(null, '', '/hotel-owner-dashboard', '');
  }

  fetchHotels(): void {
    this.isLoading = true;
    const fetchHotels$ = this.authService.getHotelsForOwner();
    const minimumDelay = new Promise(resolve => setTimeout(resolve, 3500));

    Promise.all([fetchHotels$.toPromise(), minimumDelay]).then(([hotels]) => {
      this.hotels = hotels || [];
      console.log('Fetched Hotels:', this.hotels);
      this.hotels.forEach(hotel => {
        console.log(`Hotel: ${hotel.name}, Images:`, hotel.images);
      });
      this.filterHotels();
      this.isLoading = false;
    }).catch(error => {
      console.error('Error fetching hotels:', error);
      this.isLoading = false;
    });
  }

  filterHotels(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      this.filteredHotels = this.hotels.filter(hotel =>
        (hotel.name?.toLowerCase().includes(term) || false) ||
        (hotel.city?.toLowerCase().includes(term) || false)
      );
    } else {
      this.filteredHotels = [...this.hotels];
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredHotels.length / this.hotelsPerPage);
    const startIndex = (this.currentPage - 1) * this.hotelsPerPage;
    const endIndex = startIndex + this.hotelsPerPage;
    this.paginatedHotels = this.filteredHotels.slice(startIndex, endIndex);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getPrimaryImage(hotel: Hotel): string {
    const primaryImage = hotel.images?.find(image => image.isPrimary);
    const imageUrl = primaryImage ? primaryImage.imageUrl : 'https://via.placeholder.com/150';
    console.log(`Primary Image for ${hotel.name}: ${imageUrl}`);
    return imageUrl;
  }

  getAdditionalImages(hotel: Hotel): { imageUrl: string }[] {
    const additionalImages = hotel.images?.filter(image => !image.isPrimary) || [];
    const images = additionalImages.slice(0, 3);
    console.log(`Additional Images for ${hotel.name}:`, images);
    return images;
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/150';
  }

  getStarRatingArray(starRating: number): number[] {
    return Array(starRating).fill(0).map((_, i) => i + 1);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    if (this.authService.isLoggedIn() && this.authService.getUserRole() === 'HotelOwner') {
      this.locationStrategy.pushState(null, '', '/hotel-owner-dashboard', '');
      this.router.navigate(['/hotel-owner-dashboard'], { replaceUrl: true });
    }
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.hotelsSub) {
      this.hotelsSub.unsubscribe();
    }
  }
}