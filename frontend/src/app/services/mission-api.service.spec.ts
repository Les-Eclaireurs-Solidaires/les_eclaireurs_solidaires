import { TestBed } from '@angular/core/testing';

import { MissionAPIService } from './mission-api.service';

describe('MissionAPIService', () => {
  let service: MissionAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MissionAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
