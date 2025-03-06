import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HotelService } from '../services/hotel.service';
import { trigger, transition, style, animate } from '@angular/animations';
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
  imageUrl?: string;
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
}

@Component({
  selector: 'app-hotel-browse',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hotel-browse.component.html',
  styleUrls: ['./hotel-browse.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HotelBrowseComponent implements OnInit {
  hotels: Hotel[] = [];
  errorMessage: string = '';
  selectedHotel: Hotel | null = null;

  // Static list of hotel-themed images (public domain or free-to-use from Unsplash/Pexels)
  private hotelImages: string[] = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
  ];

  constructor(private hotelService: HotelService, private router: Router) {}

  ngOnInit() {
    this.loadHotels();
  }

  loadHotels() {
    this.hotelService.getAllHotels().subscribe({
      next: (realHotels: Hotel[]) => {
        this.hotels = realHotels;
        const randomHotels = this.generateRandomHotels(20); // 20 random hotels
        this.hotels = [...this.hotels, ...randomHotels];
      },
      error: (error: any) => {
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

  viewHotelDetails(hotel: Hotel) {
    this.selectedHotel = this.selectedHotel === hotel ? null : hotel;
  }
}