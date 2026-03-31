import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionCard } from './mission-card';

describe('MissionCard', () => {
  let component: MissionCard;
  let fixture: ComponentFixture<MissionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
