import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionFormPage } from './mission-form-page';

describe('MissionFormPage', () => {
  let component: MissionFormPage;
  let fixture: ComponentFixture<MissionFormPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionFormPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionFormPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
