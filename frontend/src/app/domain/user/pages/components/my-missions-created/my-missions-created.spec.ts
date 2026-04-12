import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMissionsCreated } from './my-missions-created';

describe('MyMissionsCreated', () => {
  let component: MyMissionsCreated;
  let fixture: ComponentFixture<MyMissionsCreated>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMissionsCreated]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyMissionsCreated);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
