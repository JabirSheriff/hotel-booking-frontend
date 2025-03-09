export interface HotelImage {
    id: number;
    imageUrl: string;
    hotelId: number;
    isPrimary: boolean;
  }
  
  export interface Amenity {
    name: string;
  }
  
  // src/models/hotel.ts
export interface Room {
    id: number;
    roomNumber: string;
    type: string; // Required, as the backend always sends this
    description: string;
    pricePerNight: number;
    isAvailable: boolean;
    capacity: number;
    hotelId: number;
    hotel?: Hotel;
    bookingRooms?: any[];
  }
  
  export interface Review {
    reviewId: number;
    hotelId: number;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }
  
  export interface Hotel {
    id: number;
    name: string;
    address: string;
    city: string;
    country: string;
    pricePerNight?: number;
    originalPrice?: number;
    starRating?: number;
    ratingCount?: number;
    description?: string;
    imageUrl?: string;
    images: HotelImage[];
    amenities: Amenity[];
    rooms: Room[];
    currentImageIndex?: number;
    latitude?: number;
    longitude?: number;
    contactEmail?: string;
    contactPhone?: string;
  }