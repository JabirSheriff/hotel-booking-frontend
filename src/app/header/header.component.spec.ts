import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', ['openSignupModal', 'openLoginModal', 'logout', 'isLoggedIn', 'getUserRole'], {
      user$: { subscribe: () => new Subscription() }
    });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HeaderComponent],
      providers: [{ provide: AuthService, useValue: spy }]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    authServiceSpy.isLoggedIn.and.returnValue(false);
    authServiceSpy.getUserRole.and.returnValue(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Register and Sign In buttons and List Your Property link with capsule styles when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const links = fixture.debugElement.queryAll(By.css('a'));
    expect(buttons.length).toBe(2); // Register, Sign In
    expect(links.length).toBe(2); // Logo + List Your Property
    expect(buttons[0].nativeElement.textContent).toContain('Register');
    expect(buttons[1].nativeElement.textContent).toContain('Sign In');
    expect(links[1].nativeElement.textContent).toContain('List Your Property');
    expect(buttons[0].nativeElement.classList).toContain('rounded-full');
    expect(buttons[1].nativeElement.classList).toContain('rounded-full');
    expect(links[1].nativeElement.classList).toContain('rounded-full');
    expect(links[1].nativeElement.getAttribute('ng-reflect-router-link')).toBe('/hotel-owner-signup');
  });

  it('should call openSignupModal when Register button is clicked', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();

    const registerButton = fixture.debugElement.query(By.css('button:first-child'));
    registerButton.triggerEventHandler('click', null);
    expect(authServiceSpy.openSignupModal).toHaveBeenCalled();
  });

  it('should call openLoginModal when Sign In button is clicked', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();

    const signInButton = fixture.debugElement.query(By.css('button:nth-child(2)'));
    signInButton.triggerEventHandler('click', null);
    expect(authServiceSpy.openLoginModal).toHaveBeenCalled();
  });

  it('should show user info and dropdown with navigation when logged in as Customer', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUserRole.and.returnValue('Customer');
    authServiceSpy.user$.subscribe = jasmine.createSpy().and.callFake(callback => {
      callback({ fullName: 'John Doe' });
      return new Subscription();
    });
    fixture.detectChanges();

    const avatar = fixture.debugElement.query(By.css('.avatar'));
    const greeting = fixture.debugElement.query(By.css('span'));
    expect(avatar.nativeElement.textContent).toContain('J');
    expect(greeting.nativeElement.textContent).toContain('Hi, John Doe!');

    component.showUserDropdown = true;
    fixture.detectChanges();

    const dropdownItems = fixture.debugElement.queryAll(By.css('a'));
    expect(dropdownItems.length).toBe(3); // Profile, My Bookings, Favorites
    expect(dropdownItems[0].nativeElement.textContent).toContain('Profile');
    expect(dropdownItems[1].nativeElement.textContent).toContain('My Bookings');
    expect(dropdownItems[2].nativeElement.textContent).toContain('Favorites');
  });

  it('should call logout when Sign Out is clicked', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUserRole.and.returnValue('Customer');
    authServiceSpy.user$.subscribe = jasmine.createSpy().and.callFake(callback => {
      callback({ fullName: 'John Doe' });
      return new Subscription();
    });
    fixture.detectChanges();

    component.showUserDropdown = true;
    fixture.detectChanges();

    const signOutButton = fixture.debugElement.query(By.css('.w-full button'));
    signOutButton.triggerEventHandler('click', null);
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});