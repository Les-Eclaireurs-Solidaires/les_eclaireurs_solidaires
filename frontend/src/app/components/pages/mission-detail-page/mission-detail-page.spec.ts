import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionDetailPage } from './mission-detail-page';

describe('MissionDetailPage', () => {
  let component: MissionDetailPage;
  let fixture: ComponentFixture<MissionDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionDetailPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionDetailPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
