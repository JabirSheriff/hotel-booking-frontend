import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelOwnerDashboardComponent } from './hotel-owner-dashboard.component';

describe('HotelOwnerDashboardComponent', () => {
  let component: HotelOwnerDashboardComponent;
  let fixture: ComponentFixture<HotelOwnerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelOwnerDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelOwnerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
