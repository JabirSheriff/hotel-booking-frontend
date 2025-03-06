import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelOwnerBookingsComponent } from './hotel-owner-bookings.component';

describe('HotelOwnerBookingsComponent', () => {
  let component: HotelOwnerBookingsComponent;
  let fixture: ComponentFixture<HotelOwnerBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelOwnerBookingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelOwnerBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
