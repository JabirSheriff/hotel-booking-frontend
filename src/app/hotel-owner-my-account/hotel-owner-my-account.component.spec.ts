import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelOwnerMyAccountComponent } from './hotel-owner-my-account.component';

describe('HotelOwnerMyAccountComponent', () => {
  let component: HotelOwnerMyAccountComponent;
  let fixture: ComponentFixture<HotelOwnerMyAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelOwnerMyAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelOwnerMyAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
