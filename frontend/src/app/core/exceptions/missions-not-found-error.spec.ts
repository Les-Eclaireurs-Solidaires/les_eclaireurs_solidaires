import { MissionsNotFoundError } from './missions-error.error';

describe('MissionsNotFoundError', () => {
  it('should create an instance', () => {
    expect(new MissionsNotFoundError()).toBeTruthy();
  });
});
