import { TestBed } from '@angular/core/testing';
import { UserStateService } from './user-state.service';

describe('UserService', () => {
  let service: UserStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
