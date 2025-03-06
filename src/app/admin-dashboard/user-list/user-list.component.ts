import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">User Management</h2>
      <table class="w-full text-left">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2">ID</th>
            <th class="p-2">Name</th>
            <th class="p-2">Email</th>
            <th class="p-2">Role</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users" class="border-b">
            <td class="p-2">{{ user.id }}</td>
            <td class="p-2">{{ user.fullName }}</td>
            <td class="p-2">{{ user.email }}</td>
            <td class="p-2">{{ user.role }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: []
})
export class UserListComponent implements OnInit {
  users: User[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<User[]>('http://localhost:5280/api/users').subscribe({
      next: (users) => this.users = users,
      error: (err) => console.error('Error fetching users:', err)
    });
  }
}