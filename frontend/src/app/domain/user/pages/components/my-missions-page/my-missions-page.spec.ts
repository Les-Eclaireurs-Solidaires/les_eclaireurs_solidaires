import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMissionsPage } from './my-missions-page';

describe('MyMissionsPage', () => {
  let component: MyMissionsPage;
  let fixture: ComponentFixture<MyMissionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMissionsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyMissionsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
