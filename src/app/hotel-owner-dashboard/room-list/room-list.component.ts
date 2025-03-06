import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../services/room.service';
import { trigger, transition, style, animate } from '@angular/animations';
import * as jsonpatch from 'fast-json-patch';

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
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  errorMessage: string = '';
  hotelId: number = 0;
  showAddRoomPopup: boolean = false;
  showEditRoomPopup: boolean = false;
  newRoom: any = { roomNumber: '', type: 'Single', description: '', pricePerNight: 0, isAvailable: true, capacity: 1, hotelId: 0 };
  editRoom: Room | null = null;

  constructor(private roomService: RoomService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.hotelId = +this.route.snapshot.paramMap.get('hotelId')!;
    this.newRoom.hotelId = this.hotelId;
    this.loadRooms();
  }

  loadRooms() {
    this.roomService.getRoomsByHotelId(this.hotelId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.errorMessage = 'Failed to load rooms. Please try again.';
      }
    });
  }

  toggleAddRoomPopup() {
    this.showAddRoomPopup = !this.showAddRoomPopup;
    if (!this.showAddRoomPopup) {
      this.newRoom = { roomNumber: '', type: 'Single', description: '', pricePerNight: 0, isAvailable: true, capacity: 1, hotelId: this.hotelId };
    }
    this.showEditRoomPopup = false;
  }

  addRoom() {
    this.roomService.addRoom(this.newRoom).subscribe({
      next: (room) => {
        this.rooms.push(room);
        this.toggleAddRoomPopup();
      },
      error: (error) => {
        console.error('Error adding room:', error);
        this.errorMessage = 'Failed to add room. Please try again.';
      }
    });
  }

  toggleEditRoomPopup(room: Room) {
    this.editRoom = { ...room };
    this.showEditRoomPopup = !this.showEditRoomPopup;
    this.showAddRoomPopup = false;
  }

  updateRoom() {
    if (!this.editRoom) return;
    const originalRoom = this.rooms.find(r => r.id === this.editRoom!.id);
    const patch = jsonpatch.compare(originalRoom!, this.editRoom);
    this.roomService.updateRoom(this.editRoom.id, patch).subscribe({
      next: (updatedRoom) => {
        const index = this.rooms.findIndex(r => r.id === updatedRoom.id);
        this.rooms[index] = updatedRoom;
        this.toggleEditRoomPopup(updatedRoom);
      },
      error: (error) => {
        console.error('Error updating room:', error);
        this.errorMessage = 'Failed to update room. Please try again.';
      }
    });
  }

  deleteRoom(roomId: number) {
    if (confirm('Are you sure you want to delete this room?')) {
      this.roomService.deleteRoom(roomId).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => r.id !== roomId);
        },
        error: (error) => {
          console.error('Error deleting room:', error);
          this.errorMessage = 'Failed to delete room. Please try again.';
        }
      });
    }
  }

  toggleAvailability(room: Room) {
    const originalRoom = { ...room };
    room.isAvailable = !room.isAvailable;
    const patch = jsonpatch.compare(originalRoom, room);
    this.roomService.updateRoom(room.id, patch).subscribe({
      next: (updatedRoom) => {
        const index = this.rooms.findIndex(r => r.id === updatedRoom.id);
        this.rooms[index] = updatedRoom;
      },
      error: (error) => {
        console.error('Error toggling availability:', error);
        this.errorMessage = 'Failed to toggle availability. Please try again.';
        room.isAvailable = originalRoom.isAvailable; // Revert on error
      }
    });
  }
}