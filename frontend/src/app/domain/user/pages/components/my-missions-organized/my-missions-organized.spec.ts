import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMissionsOrganized } from './my-missions-organized';

describe('MyMissionsOrganized', () => {
  let component: MyMissionsOrganized;
  let fixture: ComponentFixture<MyMissionsOrganized>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMissionsOrganized]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyMissionsOrganized);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
