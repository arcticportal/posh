import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeResultComponent } from './home-result.component';

describe('HomeResultComponent', () => {
  let component: HomeResultComponent;
  let fixture: ComponentFixture<HomeResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
