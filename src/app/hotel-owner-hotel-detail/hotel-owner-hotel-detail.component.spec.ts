import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelOwnerHotelDetailComponent } from './hotel-owner-hotel-detail.component';

describe('HotelOwnerHotelDetailComponent', () => {
  let component: HotelOwnerHotelDetailComponent;
  let fixture: ComponentFixture<HotelOwnerHotelDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelOwnerHotelDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelOwnerHotelDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
