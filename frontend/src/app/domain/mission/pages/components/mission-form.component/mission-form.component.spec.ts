import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionFormComponent } from './mission-form.component';

describe('MissionFormComponent', () => {
  let component: MissionFormComponent;
  let fixture: ComponentFixture<MissionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
