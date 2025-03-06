import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard'; // Import the class
import { AuthService } from './services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Mock AuthService and Router
    const authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUserRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    // Inject the guard and mocks
    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if user is logged in and has correct role', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.getUserRole.and.returnValue('Customer');
    const route = {} as any; // Mock ActivatedRouteSnapshot
    const state = { url: '/my-account' } as any; // Mock RouterStateSnapshot

    const result = guard.canActivate(route, state);

    expect(result).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should redirect to "/" if user is not logged in', () => {
    authService.isLoggedIn.and.returnValue(false);
    const route = {} as any;
    const state = { url: '/my-account' } as any;

    const result = guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should block hotel-owner-my-account for non-HotelOwner role', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.getUserRole.and.returnValue('Customer');
    const route = {} as any;
    const state = { url: '/hotel-owner-my-account' } as any;

    const result = guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should block customer routes for non-Customer role', () => {
    authService.isLoggedIn.and.returnValue(true);
    authService.getUserRole.and.returnValue('HotelOwner');
    const route = {} as any;
    const state = { url: '/customer-dashboard' } as any;

    const result = guard.canActivate(route, state);

    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});