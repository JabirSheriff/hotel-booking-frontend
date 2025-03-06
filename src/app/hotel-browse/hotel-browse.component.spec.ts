import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBrowseComponent } from './hotel-browse.component';

describe('HotelBrowseComponent', () => {
  let component: HotelBrowseComponent;
  let fixture: ComponentFixture<HotelBrowseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBrowseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBrowseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
