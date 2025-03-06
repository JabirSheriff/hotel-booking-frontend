import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roleFilter: string = 'All';
  searchTerm: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';
  roleCounts = { Admin: 0, Customer: 0, HotelOwner: 0, Unassigned: 0 };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<User[]>(`${environment.apiUrl}/Auth/users`).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.calculateRoleCounts();
        this.renderPieChart(); // Moved here
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.errorMessage = 'Failed to load users. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  calculateRoleCounts(): void {
    this.roleCounts = { Admin: 0, Customer: 0, HotelOwner: 0, Unassigned: 0 };
    this.users.forEach(user => {
      if (user.role === 'Admin') this.roleCounts.Admin++;
      else if (user.role === 'Customer') this.roleCounts.Customer++;
      else if (user.role === 'HotelOwner') this.roleCounts.HotelOwner++;
      else if (user.role === 'Unassigned') this.roleCounts.Unassigned++;
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesRole = this.roleFilter === 'All' || user.role === this.roleFilter;
      const matchesSearch = !this.searchTerm || 
        user.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }

  onRoleFilterChange(): void {
    this.filterUsers();
  }

  onSearch(): void {
    this.filterUsers();
  }

  renderPieChart(): void {
    const ctx = document.getElementById('rolePieChart') as HTMLCanvasElement;
    if (ctx) {
      console.log('Rendering chart with data:', this.roleCounts); // Debug log
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Admins', 'Customers', 'Hotel Owners', 'Unassigned'],
          datasets: [{
            data: [this.roleCounts.Admin, this.roleCounts.Customer, this.roleCounts.HotelOwner, this.roleCounts.Unassigned],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    } else {
      console.error('Canvas element #rolePieChart not found');
    }
  }
}