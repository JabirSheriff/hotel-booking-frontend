import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(private http: HttpClient) {}

  getRoomsByHotelId(hotelId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${environment.apiUrl}/rooms/get-rooms/${hotelId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
  }

  addRoom(room: any): Observable<Room> {
    return this.http.post<Room>(`${environment.apiUrl}/rooms/add-room`, room, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
  }

  updateRoom(roomId: number, patchDoc: any): Observable<Room> {
    return this.http.patch<Room>(`${environment.apiUrl}/rooms/update-room/${roomId}`, patchDoc, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
  }

  deleteRoom(roomId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/rooms/delete-room/${roomId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
  }
}