import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  userFullName: string | null = null;
  userInitial: string | null = null;
  showUserDropdown: boolean = false;
  private userSub: Subscription | undefined;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userRole = this.authService.getUserRole();
    this.userFullName = localStorage.getItem('userFullName');
    this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;

    this.userSub = this.authService.user$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user ? user.role : null;
      this.userFullName = user ? user.fullName : null;
      this.userInitial = this.userFullName ? this.userFullName.charAt(0).toUpperCase() : null;
    });
  }

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
  }

  openSignupModal(): void {
    this.authService.openSignupModal();
  }

  openLoginModal(): void {
    this.authService.openLoginModal();
  }

  logout(): void {
    this.authService.logout();
    this.showUserDropdown = false;
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}