import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionCreatePage } from './mission-create.page';

describe('MissionCreatePage', () => {
  let component: MissionCreatePage;
  let fixture: ComponentFixture<MissionCreatePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionCreatePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionCreatePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
