import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { HotelOwnerDashboardComponent } from './hotel-owner-dashboard/hotel-owner-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { SignupComponent } from './signup/signup.component';
import { HotelOwnerSignupComponent } from './hotel-owner-signup/hotel-owner-signup.component';
import { RoomListComponent } from './hotel-owner-dashboard/room-list/room-list.component';
import { HotelBrowseComponent } from './hotel-browse/hotel-browse.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { BookingComponent } from './booking/booking.component';
import { HotelOwnerBookingsComponent } from './hotel-owner-bookings/hotel-owner-bookings.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { AuthGuard } from './auth.guard';
import { MyBookingsComponent } from './my-bookings/my-bookings.component';
import { HotelOwnerMyAccountComponent } from './hotel-owner-my-account/hotel-owner-my-account.component';
import { AdminMyAccountComponent } from './admin-my-account/admin-my-account.component'; // Add this
import { UserListComponent } from './admin-dashboard/user-list/user-list.component';
import { AdminUserManagementComponent } from './admin-user-management/admin-user-management.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  {path: 'user-management', component:AdminUserManagementComponent, canActivate: [AuthGuard]},
  // {
  //   path: 'admin',
  //   component: AdminDashboardComponent,
  //   children: [
  //     { path: 'dashboard', component: AdminDashboardComponent }, // Default dashboard content
  //     // { path: 'properties', component: /* PropertiesComponent */ }, // Placeholder
  //     // { path: 'bookings', component: /* BookingsComponent */ }, // Placeholder
  //     { path: 'user-management', component: UserListComponent },
  //     { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
  //   ]
  // },
  { path: 'customer-dashboard', component: CustomerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'my-account', component: MyAccountComponent, canActivate: [AuthGuard] },
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [AuthGuard] },
  { path: 'hotel-owner-dashboard', component: HotelOwnerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'hotel-owner-my-account', component: HotelOwnerMyAccountComponent, canActivate: [AuthGuard] },
  { path: 'hotel-owner-dashboard/rooms/:hotelId', component: RoomListComponent },
  { path: 'hotel-owner-dashboard/bookings', component: HotelOwnerBookingsComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin-my-account', component: AdminMyAccountComponent, canActivate: [AuthGuard] }, // Update this
  { path: 'signup', component: SignupComponent },
  { path: 'hotel-owner-signup', component: HotelOwnerSignupComponent },
  { path: 'hotels', component: HotelBrowseComponent },
  { path: 'book/:hotelId', component: BookingComponent },
  { path: '**', redirectTo: '' }
];