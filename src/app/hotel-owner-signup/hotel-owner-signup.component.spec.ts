import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelOwnerSignupComponent } from './hotel-owner-signup.component';

describe('HotelOwnerSignupComponent', () => {
  let component: HotelOwnerSignupComponent;
  let fixture: ComponentFixture<HotelOwnerSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelOwnerSignupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelOwnerSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
