import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
  rooms?: Room[];
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

interface AddRoomForm {
  roomNumber: string;
  type: string;
  description: string;
  pricePerNight: number;
  isAvailable: boolean;
  capacity: number;
  hotelId: number;
}

interface EditRoomForm extends Room {} // Same fields as Room for editing

interface Review {
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-hotel-owner-hotel-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hotel-owner-hotel-detail.component.html',
  styleUrls: ['./hotel-owner-hotel-detail.component.css']
})
export class HotelOwnerHotelDetailComponent implements OnInit {
  hotel: Hotel | null = null;
  currentImageIndex: number = 0;
  showAddRoomModal: boolean = false;
  showEditRoomModal: boolean = false;
  showUserDropdown: boolean = false;
  userInitial: string = 'U'; // Placeholder—set from sessionStorage or service
  userFullName: string = 'User'; // Placeholder—set from sessionStorage or service
  hotelAmenities: string = 'None'; // Computed amenities string
  hotelStarRating: string = ''; // Computed star rating string
  addRoomForm: AddRoomForm = {
    roomNumber: '',
    type: 'StandardWithBalcony',
    description: '',
    pricePerNight: 0,
    isAvailable: true,
    capacity: 1,
    hotelId: 0
  };
  editRoomForm: EditRoomForm = {
    id: 0,
    roomNumber: '',
    type: 'StandardWithBalcony',
    description: '',
    pricePerNight: 0,
    isAvailable: true,
    capacity: 1,
    hotelId: 0
  };
  roomTypes = ['StandardWithBalcony', 'SuperiorWithBalcony', 'PremiumWithBalcony'];
  reviews: Review[] = [
    { userName: 'John Doe', rating: 4, comment: 'Great stay, loved the view!', date: '2025-02-15' },
    { userName: 'Jane Smith', rating: 5, comment: 'Amazing service, will come back!', date: '2025-01-20' }
  ]; // Mock reviews

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hotelId = Number(this.route.snapshot.paramMap.get('hotelId'));
    this.fetchHotelDetails(hotelId);
    this.fetchRooms(hotelId);
    // Set user info from sessionStorage (adjust based on your auth setup)
    const userName = sessionStorage.getItem('userFullName') || 'User';
    this.userFullName = userName;
    this.userInitial = userName.charAt(0).toUpperCase();
  }

  fetchHotelDetails(hotelId: number): void {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<Hotel>(`${environment.apiUrl}/hotels/${hotelId}`, { headers }).subscribe({
      next: (data) => {
        this.hotel = data;
        this.addRoomForm.hotelId = hotelId;
        this.updateHotelDisplayValues(); // Compute display values after fetch
      },
      error: (error) => {
        console.error('Error fetching hotel:', error);
        this.router.navigate(['/hotel-owner-dashboard']);
      }
    });
  }

  fetchRooms(hotelId: number): void {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<Room[]>(`${environment.apiUrl}/rooms/get-rooms/${hotelId}`, { headers }).subscribe({
      next: (rooms) => {
        if (this.hotel) {
          this.hotel.rooms = rooms;
        }
      },
      error: (error) => console.error('Error fetching rooms:', error)
    });
  }

  updateHotelDisplayValues(): void {
    if (this.hotel) {
      // Compute amenities string
      this.hotelAmenities = this.hotel.amenities?.map(a => a.name).join(', ') || 'None';
      // Compute star rating string
      this.hotelStarRating = '★'.repeat(this.hotel.starRating);
    }
  }

  nextImage(): void {
    if (this.hotel?.images && this.currentImageIndex < this.hotel.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  getCurrentImage(): string {
    return this.hotel?.images?.[this.currentImageIndex]?.imageUrl || 'https://via.placeholder.com/600';
  }

  getStarRatingArray(rating: number): number[] {
    return Array(rating).fill(0).map((_, i) => i + 1);
  }

  getReviewStars(rating: number): string {
    return '★'.repeat(rating);
  }

  openAddRoomModal(): void {
    this.showAddRoomModal = true;
  }

  closeAddRoomModal(): void {
    this.showAddRoomModal = false;
    this.resetAddRoomForm();
  }

  resetAddRoomForm(): void {
    this.addRoomForm = {
      roomNumber: '',
      type: 'StandardWithBalcony',
      description: '',
      pricePerNight: 0,
      isAvailable: true,
      capacity: 1,
      hotelId: this.hotel?.id || 0
    };
  }

  addRoom(): void {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('No token found. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }
    if (!this.addRoomForm.roomNumber || !this.addRoomForm.description || this.addRoomForm.pricePerNight <= 0 || this.addRoomForm.capacity <= 0) {
      alert('Please fill in all required fields.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<Room>(`${environment.apiUrl}/rooms/add-room`, this.addRoomForm, { headers }).subscribe({
      next: (room) => {
        if (this.hotel) {
          this.hotel.rooms = this.hotel.rooms || [];
          this.hotel.rooms.push(room);
        }
        this.closeAddRoomModal();
      },
      error: (error) => {
        console.error('Error adding room:', error);
        alert('Failed to add room.');
      }
    });
  }

  openEditRoomModal(room: Room): void {
    this.editRoomForm = { ...room }; // Pre-fill form with room data
    this.showEditRoomModal = true;
  }

  closeEditRoomModal(): void {
    this.showEditRoomModal = false;
    this.resetEditRoomForm();
  }

  resetEditRoomForm(): void {
    this.editRoomForm = {
      id: 0,
      roomNumber: '',
      type: 'StandardWithBalcony',
      description: '',
      pricePerNight: 0,
      isAvailable: true,
      capacity: 1,
      hotelId: this.hotel?.id || 0
    };
  }

  updateRoom(): void {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('No token found. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }
    if (!this.editRoomForm.roomNumber || !this.editRoomForm.description || this.editRoomForm.pricePerNight <= 0 || this.editRoomForm.capacity <= 0) {
      alert('Please fill in all required fields.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch<Room>(`${environment.apiUrl}/rooms/update-room/${this.editRoomForm.id}`, this.editRoomForm, { headers }).subscribe({
      next: (updatedRoom) => {
        if (this.hotel && this.hotel.rooms) {
          const index = this.hotel.rooms.findIndex(r => r.id === updatedRoom.id);
          if (index !== -1) {
            this.hotel.rooms[index] = updatedRoom;
          }
        }
        this.closeEditRoomModal();
      },
      error: (error) => {
        console.error('Error updating room:', error);
        alert('Failed to update room.');
      }
    });
  }

  deleteRoom(roomId: number): void {
    const token = sessionStorage.getItem('authToken');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.delete(`${environment.apiUrl}/rooms/delete-room/${roomId}`, { headers }).subscribe({
      next: () => {
        if (this.hotel && this.hotel.rooms) {
          this.hotel.rooms = this.hotel.rooms.filter(r => r.id !== roomId);
        }
      },
      error: (error) => console.error('Error deleting room:', error)
    });
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}