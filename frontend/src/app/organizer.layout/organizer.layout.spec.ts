import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerLayout } from './organizer.layout';

describe('OrganizerLayout', () => {
  let component: OrganizerLayout;
  let fixture: ComponentFixture<OrganizerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizerLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
