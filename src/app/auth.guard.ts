import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/');
      return false;
    }

    const userRole = this.authService.getUserRole();
    const url = state.url;

    // Admin routes
    if ((url === '/admin-dashboard' || url === '/admin-my-account') && userRole !== 'Admin') {
      this.router.navigateByUrl('/');
      return false;
    }

    // Hotel Owner routes
    if (url === '/hotel-owner-my-account' && userRole !== 'HotelOwner') {
      this.router.navigateByUrl('/');
      return false;
    }

    // Customer routes
    if ((url === '/customer-dashboard' || url === '/my-account' || url === '/my-bookings') && userRole !== 'Customer') {
      this.router.navigateByUrl('/');
      return false;
    }

    return true;
  }
}