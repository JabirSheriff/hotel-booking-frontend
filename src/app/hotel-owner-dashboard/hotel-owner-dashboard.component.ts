import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { AuthModalsComponent } from '../auth-modals/auth-modals.component';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

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

interface AddHotelForm {
  name: string;
  address: string;
  city: string;
  country: string;
  starRating: number | null;
  description: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  amenities: string[];
  imageFiles: string[];
  primaryImageIndex: number | null;
}

interface EditHotelForm {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  starRating: number | null;
  description: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  amenities: string[];
  imageFiles: string[];
  primaryImageIndex: number | null;
}

@Component({
  selector: 'app-hotel-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthModalsComponent, FormsModule],
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
  showAddHotelModal: boolean = false;
  showEditHotelModal: boolean = false;
  addHotelForm: AddHotelForm = {
    name: '',
    address: '',
    city: '',
    country: '',
    starRating: null,
    description: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
    amenities: [],
    imageFiles: [],
    primaryImageIndex: null
  };
  editHotelForm: EditHotelForm = {
    id: 0,
    name: '',
    address: '',
    city: '',
    country: '',
    starRating: null,
    description: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
    amenities: [],
    imageFiles: [],
    primaryImageIndex: null
  };
  private userSub: Subscription | undefined;
  private hotelsSub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private locationStrategy: LocationStrategy,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.userFullName = sessionStorage.getItem('userFullName');
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
    return primaryImage ? primaryImage.imageUrl : 'https://via.placeholder.com/150';
  }

  getAdditionalImages(hotel: Hotel): { imageUrl: string }[] {
    return hotel.images?.filter(image => !image.isPrimary).slice(0, 3) || [];
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/150';
  }

  getStarRatingArray(starRating: number): number[] {
    return Array(starRating).fill(0).map((_, i) => i + 1);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
    this.router.navigate(['/login']);
  }

  onModalVisibilityChange(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  openAddHotelModal(): void {
    this.showAddHotelModal = true;
  }

  closeAddHotelModal(): void {
    this.showAddHotelModal = false;
    this.resetAddHotelForm();
  }

  resetAddHotelForm(): void {
    this.addHotelForm = {
      name: '',
      address: '',
      city: '',
      country: '',
      starRating: null,
      description: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
      amenities: [],
      imageFiles: [],
      primaryImageIndex: null
    };
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.addHotelForm.imageFiles.push(e.target.result as string);
          if (this.addHotelForm.primaryImageIndex === null && this.addHotelForm.imageFiles.length === 1) {
            this.addHotelForm.primaryImageIndex = 0;
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  setPrimaryImage(index: number): void {
    this.addHotelForm.primaryImageIndex = index;
  }

  addAmenity(amenityInput: HTMLInputElement): void {
    const amenity = amenityInput.value.trim();
    if (amenity && !this.addHotelForm.amenities.includes(amenity)) {
      this.addHotelForm.amenities.push(amenity);
      amenityInput.value = '';
    }
  }

  removeAmenity(index: number): void {
    this.addHotelForm.amenities.splice(index, 1);
  }

  createHotel(): void {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('No token found. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }
    if (!this.addHotelForm.name || !this.addHotelForm.city || !this.addHotelForm.country) {
      alert('Please fill in all required fields (Name, City, Country).');
      return;
    }

    const hotelDto = {
      name: this.addHotelForm.name,
      address: this.addHotelForm.address,
      city: this.addHotelForm.city,
      country: this.addHotelForm.country,
      starRating: this.addHotelForm.starRating,
      description: this.addHotelForm.description,
      contactEmail: this.addHotelForm.contactEmail,
      contactPhone: this.addHotelForm.contactPhone,
      isActive: this.addHotelForm.isActive,
      amenities: this.addHotelForm.amenities,
      imageFiles: this.addHotelForm.imageFiles,
      primaryImageIndex: this.addHotelForm.primaryImageIndex
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const apiUrl = `${environment.apiUrl}/hotels/add`;
    this.http.post(apiUrl, hotelDto, { headers }).subscribe({
      next: (response: any) => {
        const newHotel: Hotel = {
          id: response.id,
          name: response.name,
          address: response.address,
          city: response.city,
          country: response.country,
          starRating: response.starRating || 0,
          description: response.description,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          isActive: response.isActive,
          hotelOwnerId: response.hotelOwnerId,
          images: response.images,
          amenities: response.amenities.map((a: any) => ({ name: a.name })),
          rooms: []
        };
        this.hotels.push(newHotel);
        this.filterHotels();
        this.closeAddHotelModal();
      },
      error: (error) => {
        console.error('Error adding hotel:', error);
        alert('Failed to add hotel. Error: ' + (error.statusText || 'Unknown error'));
      }
    });
  }

  // Edit Hotel Methods
  openEditHotelModal(hotel: Hotel): void {
    this.editHotelForm = {
      id: hotel.id,
      name: hotel.name,
      address: hotel.address || '',
      city: hotel.city,
      country: hotel.country,
      starRating: hotel.starRating,
      description: hotel.description || '',
      contactEmail: hotel.contactEmail || '',
      contactPhone: hotel.contactPhone || '',
      isActive: hotel.isActive,
      amenities: hotel.amenities ? hotel.amenities.map(a => a.name) : [],
      imageFiles: hotel.images ? hotel.images.map(i => i.imageUrl) : [],
      primaryImageIndex: hotel.images ? hotel.images.findIndex(i => i.isPrimary) : null
    };
    this.showEditHotelModal = true;
  }

  closeEditHotelModal(): void {
    this.showEditHotelModal = false;
    this.resetEditHotelForm();
  }

  resetEditHotelForm(): void {
    this.editHotelForm = {
      id: 0,
      name: '',
      address: '',
      city: '',
      country: '',
      starRating: null,
      description: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
      amenities: [],
      imageFiles: [],
      primaryImageIndex: null
    };
  }

  onEditImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.editHotelForm.imageFiles.push(e.target.result as string);
          if (this.editHotelForm.primaryImageIndex === null && this.editHotelForm.imageFiles.length === 1) {
            this.editHotelForm.primaryImageIndex = 0;
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  setEditPrimaryImage(index: number): void {
    this.editHotelForm.primaryImageIndex = index;
  }

  addEditAmenity(amenityInput: HTMLInputElement): void {
    const amenity = amenityInput.value.trim();
    if (amenity && !this.editHotelForm.amenities.includes(amenity)) {
      this.editHotelForm.amenities.push(amenity);
      amenityInput.value = '';
    }
  }

  removeEditAmenity(index: number): void {
    this.editHotelForm.amenities.splice(index, 1);
  }

  removeEditImage(index: number): void {
    this.editHotelForm.imageFiles.splice(index, 1);
    if (this.editHotelForm.primaryImageIndex === index) {
      this.editHotelForm.primaryImageIndex = this.editHotelForm.imageFiles.length > 0 ? 0 : null;
    } else if (this.editHotelForm.primaryImageIndex !== null && this.editHotelForm.primaryImageIndex > index) {
      this.editHotelForm.primaryImageIndex--;
    }
  }

  updateHotel(): void {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('No token found. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }
    if (!this.editHotelForm.name || !this.editHotelForm.city || !this.editHotelForm.country) {
      alert('Please fill in all required fields (Name, City, Country).');
      return;
    }

    const hotelDto = {
      name: this.editHotelForm.name,
      address: this.editHotelForm.address,
      city: this.editHotelForm.city,
      country: this.editHotelForm.country,
      starRating: this.editHotelForm.starRating,
      description: this.editHotelForm.description,
      contactEmail: this.editHotelForm.contactEmail,
      contactPhone: this.editHotelForm.contactPhone,
      isActive: this.editHotelForm.isActive,
      amenities: this.editHotelForm.amenities,
      imageFiles: this.editHotelForm.imageFiles,
      primaryImageIndex: this.editHotelForm.primaryImageIndex
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const apiUrl = `${environment.apiUrl}/hotels/${this.editHotelForm.id}`;
    this.http.patch(apiUrl, hotelDto, { headers }).subscribe({
      next: (response: any) => {
        const updatedHotelIndex = this.hotels.findIndex(h => h.id === this.editHotelForm.id);
        if (updatedHotelIndex !== -1) {
          this.hotels[updatedHotelIndex] = {
            id: response.id,
            name: response.name,
            address: response.address,
            city: response.city,
            country: response.country,
            starRating: response.starRating || 0,
            description: response.description,
            contactEmail: response.contactEmail,
            contactPhone: response.contactPhone,
            isActive: response.isActive,
            hotelOwnerId: response.hotelOwnerId,
            images: response.images,
            amenities: response.amenities.map((a: any) => ({ name: a.name })),
            rooms: this.hotels[updatedHotelIndex].rooms || []
          };
          this.filterHotels();
        }
        this.closeEditHotelModal();
      },
      error: (error) => {
        console.error('Error updating hotel:', error);
        alert('Failed to update hotel. Error: ' + (error.statusText || 'Unknown error'));
      }
    });
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    if (this.authService.isLoggedIn() && this.authService.getUserRole() === 'HotelOwner') {
      this.locationStrategy.pushState(null, '', '/hotel-owner-dashboard', '');
      this.router.navigate(['/hotel-owner-dashboard'], { replaceUrl: true });
    }
  }

  openHotelDetail(hotelId: number): void {
    window.open(`/hotel-owner-hotel-detail/${hotelId}`, '_blank');
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.hotelsSub) this.hotelsSub.unsubscribe();
  }
}