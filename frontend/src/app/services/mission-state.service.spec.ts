import { TestBed } from '@angular/core/testing';

import { MissionStateService } from './mission-state.service';

describe('MissionStateService', () => {
  let service: MissionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MissionStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
