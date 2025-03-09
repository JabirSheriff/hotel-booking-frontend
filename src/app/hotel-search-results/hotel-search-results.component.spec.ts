import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelSearchResultsComponent } from './hotel-search-results.component';

describe('HotelSearchResultsComponent', () => {
  let component: HotelSearchResultsComponent;
  let fixture: ComponentFixture<HotelSearchResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelSearchResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelSearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
