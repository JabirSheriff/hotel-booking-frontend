import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { RoomService } from '../../services/room.service';
import { trigger, transition, style, animate } from '@angular/animations';
import * as jsonpatch from 'fast-json-patch';
import { Faker, en } from '@faker-js/faker';

const faker = new Faker({ locale: [en] });

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
  imageUrl?: string; // Already here, keep it
  isRandom?: boolean;
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
  imageUrl?: string;
}

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hotel-list.component.html',
  styleUrls: ['./hotel-list.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HotelListComponent implements OnInit {
  hotels: Hotel[] = [];
  errorMessage: string = '';
  showAddHotelForm: boolean = false;
  showEditHotelPopup: boolean = false;
  newHotel: any = { name: '', address: '', city: '', country: '', starRating: null, description: '', contactEmail: '', contactPhone: '', isActive: true };
  editHotel: Hotel | null = null;
  selectedHotel: Hotel | null = null;

  private hotelImages: string[] = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
  ];

  constructor(private hotelService: HotelService, private roomService: RoomService, private router: Router) {}

  ngOnInit() {
    this.loadHotels();
  }

  loadHotels() {
    this.hotelService.getHotelsByOwner().subscribe({
      next: (realHotels: Hotel[]) => {
        // Ensure imageUrl is added to all real hotels
        this.hotels = realHotels.map(hotel => ({
          ...hotel,
          imageUrl: hotel.imageUrl || this.hotelImages[Math.floor(Math.random() * this.hotelImages.length)] // Use existing or assign random
        }));
        const randomHotels = this.generateRandomHotels(15);
        this.hotels = [...this.hotels, ...randomHotels];
        console.log('Hotels loaded:', this.hotels);
      },
      error: (error) => {
        console.error('Error loading hotels:', error);
        this.errorMessage = 'Failed to load hotels. Please try again.';
      }
    });
  }

  generateRandomHotels(count: number): Hotel[] {
    const randomHotels: Hotel[] = [];
    for (let i = 0; i < count; i++) {
      const hotel: Hotel = {
        id: -i - 1,
        name: faker.company.name() + ' Hotel',
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        starRating: faker.number.int({ min: 1, max: 5 }),
        description: faker.lorem.sentence(),
        contactEmail: faker.internet.email(),
        contactPhone: faker.phone.number(),
        isActive: true,
        hotelOwnerId: 0,
        rooms: this.generateRandomRooms(faker.number.int({ min: 1, max: 10 })),
        isRandom: true,
        imageUrl: this.hotelImages[Math.floor(Math.random() * this.hotelImages.length)]
      };
      randomHotels.push(hotel);
    }
    return randomHotels;
  }

  generateRandomRooms(count: number): Room[] {
    const rooms: Room[] = [];
    for (let i = 0; i < count; i++) {
      rooms.push({
        id: -i - 1,
        roomNumber: `R${faker.number.int({ min: 100, max: 999 })}`,
        type: faker.helpers.arrayElement(['Single', 'Double', 'Suite', 'Deluxe']),
        description: faker.lorem.sentence(),
        pricePerNight: faker.number.int({ min: 50, max: 500 }),
        isAvailable: faker.datatype.boolean(),
        capacity: faker.number.int({ min: 1, max: 4 }),
        hotelId: 0
      });
    }
    return rooms;
  }

  toggleAddHotelForm() {
    this.showAddHotelForm = !this.showAddHotelForm;
    this.newHotel = { name: '', address: '', city: '', country: '', starRating: null, description: '', contactEmail: '', contactPhone: '', isActive: true };
    this.showEditHotelPopup = false;
    this.selectedHotel = null;
  }

  addHotel() {
    this.hotelService.addHotel(this.newHotel).subscribe({
      next: (hotel) => {
        hotel.imageUrl = this.hotelImages[Math.floor(Math.random() * this.hotelImages.length)];
        this.hotels.unshift(hotel);
        this.toggleAddHotelForm();
      },
      error: (error) => {
        console.error('Error adding hotel:', error);
        this.errorMessage = 'Failed to add hotel. Please try again.';
      }
    });
  }

  goToRooms(hotelId: number) {
    this.router.navigate(['/hotel-owner-dashboard/rooms', hotelId]);
  }

  viewHotelDetails(hotel: Hotel) {
    this.selectedHotel = this.selectedHotel === hotel ? null : hotel;
    this.showAddHotelForm = false;
    this.showEditHotelPopup = false;
  }

  toggleEditHotelPopup(hotel: Hotel) {
    if (hotel.isRandom) return;
    this.editHotel = { ...hotel };
    this.showEditHotelPopup = !this.showEditHotelPopup;
    this.showAddHotelForm = false;
    this.selectedHotel = null;
  }

  updateHotel() {
    if (!this.editHotel) return;
    const originalHotel = this.hotels.find(h => h.id === this.editHotel!.id);
    const patch = jsonpatch.compare(originalHotel!, this.editHotel);
    this.hotelService.updateHotel(this.editHotel.id, patch).subscribe({
      next: () => {
        const index = this.hotels.findIndex(h => h.id === this.editHotel!.id);
        this.hotels[index] = { ...this.editHotel!, imageUrl: originalHotel!.imageUrl || this.hotelImages[Math.floor(Math.random() * this.hotelImages.length)] };
        this.toggleEditHotelPopup(this.editHotel!);
      },
      error: (error) => {
        console.error('Error updating hotel:', error);
        this.errorMessage = 'Failed to update hotel. Please try again.';
      }
    });
  }

  deleteHotel(hotelId: number) {
    if (hotelId < 0) return;
    if (confirm('Are you sure you want to delete this hotel? This will remove all associated rooms.')) {
      this.hotelService.deleteHotel(hotelId).subscribe({
        next: () => {
          this.hotels = this.hotels.filter(h => h.id !== hotelId);
        },
        error: (error) => {
          console.error('Error deleting hotel:', error);
          this.errorMessage = 'Failed to delete hotel. Please try again.';
        }
      });
    }
  }
}