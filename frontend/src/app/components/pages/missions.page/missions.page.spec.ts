import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionsPage } from './missions.page';

describe('MissionsPage', () => {
  let component: MissionsPage;
  let fixture: ComponentFixture<MissionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
