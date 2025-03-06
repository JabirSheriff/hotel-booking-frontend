import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

interface AuthResponse {
  id?: number;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  token: string;
  message?: string;
  hotelOwnerId?: number | null;
  customerId?: number | null;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phoneNumber: string;
}

interface UpdateUserDto {
  fullName: string;
  phoneNumber: string;
  password: string;
}

interface UpdateProfileResponse {
  message: string;
}

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
  rooms?: { roomNumber: string; type: string; description: string; pricePerNight: number; isAvailable: boolean; capacity: number }[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  private showSignupModalSubject = new BehaviorSubject<boolean>(false);
  showSignupModal$ = this.showSignupModalSubject.asObservable();

  private showLoginModalSubject = new BehaviorSubject<boolean>(false);
  showLoginModal$ = this.showLoginModalSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = sessionStorage.getItem('authToken'); // Use sessionStorage
    const role = sessionStorage.getItem('userRole');
    const fullName = sessionStorage.getItem('userFullName');
    const hotelOwnerId = sessionStorage.getItem('hotelOwnerId');
    if (token && role && fullName) {
      this.userSubject.next({ role, fullName, hotelOwnerId });
    } else {
      this.userSubject.next(null);
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/Auth/login`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('authToken', response.token);
          sessionStorage.setItem('userRole', response.role);
          sessionStorage.setItem('userFullName', response.fullName);
          sessionStorage.setItem('userEmail', email);
          sessionStorage.setItem('userPhoneNumber', response.phoneNumber || '');
          sessionStorage.setItem('hotelOwnerId', response.hotelOwnerId?.toString() || '');
          this.userSubject.next({ role: response.role, fullName: response.fullName, hotelOwnerId: response.hotelOwnerId });
  
          // Role-based navigation
          if (response.role === 'HotelOwner') {
            const dashboardUrl = this.router.serializeUrl(
              this.router.createUrlTree(['/hotel-owner-dashboard'])
            );
            window.open(dashboardUrl, '_blank'); // New tab for Hotel Owner
            this.closeModals();
          } else if (response.role === 'Admin') {
            const dashboardUrl = this.router.serializeUrl(
              this.router.createUrlTree(['/admin-dashboard'])
            );
            window.open(dashboardUrl, '_blank'); // New tab for Admin
            this.closeModals();
          } else if (response.role === 'Customer') {
            this.router.navigateByUrl('/'); // Stay in same tab for Customer
            this.closeModals();
          }
        }
      })
    );
  }

  registerCustomer(fullName: string, email: string, password: string, phoneNumber: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/Auth/register-customer`, { fullName, email, password, phoneNumber }).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('authToken', response.token); // Use sessionStorage
          sessionStorage.setItem('userRole', response.role);
          sessionStorage.setItem('userFullName', fullName);
          sessionStorage.setItem('userEmail', email);
          sessionStorage.setItem('userPhoneNumber', phoneNumber);
          this.userSubject.next({ role: response.role, fullName });
          this.router.navigateByUrl('/');
        }
      })
    );
  }

  registerHotelOwner(fullName: string, email: string, password: string, phoneNumber: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/Auth/register`, { fullName, email, password, phoneNumber }).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('authToken', response.token); // Use sessionStorage
          sessionStorage.setItem('userRole', response.role);
          sessionStorage.setItem('userFullName', fullName);
          sessionStorage.setItem('userEmail', email);
          sessionStorage.setItem('userPhoneNumber', phoneNumber);
          sessionStorage.setItem('hotelOwnerId', response.hotelOwnerId?.toString() || '');
          this.userSubject.next({ role: response.role, fullName, hotelOwnerId: response.hotelOwnerId });

          const dashboardUrl = this.router.serializeUrl(
            this.router.createUrlTree(['/hotel-owner-dashboard'])
          );
          window.open(dashboardUrl, '_blank');
          this.closeModals();
        }
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/Auth/users`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } // Use sessionStorage
    });
  }

  updateUserProfile(fullName: string, phoneNumber: string, password: string): Observable<UpdateProfileResponse> {
    const updateUserDto: UpdateUserDto = {
      fullName,
      phoneNumber,
      password
    };
    return this.http.put<UpdateProfileResponse>(`${environment.apiUrl}/Auth/update-profile`, updateUserDto, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } // Use sessionStorage
    }).pipe(
      tap(response => {
        if (response.message === 'Profile updated successfully.') {
          if (fullName) {
            sessionStorage.setItem('userFullName', fullName); // Use sessionStorage
            this.userSubject.next({ role: this.getUserRole(), fullName, hotelOwnerId: sessionStorage.getItem('hotelOwnerId') });
          }
          if (phoneNumber) {
            sessionStorage.setItem('userPhoneNumber', phoneNumber); // Use sessionStorage
          }
        }
      })
    );
  }

  getHotelsForOwner(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(`${environment.apiUrl}/hotels/by-owner`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } // Use sessionStorage
    });
  }

  logout(): void {
    sessionStorage.removeItem('authToken'); // Use sessionStorage
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userFullName');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userPhoneNumber');
    sessionStorage.removeItem('hotelOwnerId');
    this.userSubject.next(null);
    window.close();
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('authToken'); // Use sessionStorage
  }

  getUserRole(): string | null {
    return sessionStorage.getItem('userRole'); // Use sessionStorage
  }

  openSignupModal(): void {
    this.showSignupModalSubject.next(true);
    this.showLoginModalSubject.next(false);
  }

  openLoginModal(): void {
    this.showLoginModalSubject.next(true);
    this.showSignupModalSubject.next(false);
  }

  closeModals(): void {
    this.showSignupModalSubject.next(false);
    this.showLoginModalSubject.next(false);
  }
}