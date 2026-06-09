import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGlobeComponent } from './home-globe.component';

describe('HomeGlobeComponent', () => {
  let component: HomeGlobeComponent;
  let fixture: ComponentFixture<HomeGlobeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGlobeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
