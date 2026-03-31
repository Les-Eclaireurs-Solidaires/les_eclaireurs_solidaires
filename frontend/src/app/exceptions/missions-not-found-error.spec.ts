import { MissionsNotFoundError } from './missions-not-found-error';

describe('MissionsNotFoundError', () => {
  it('should create an instance', () => {
    expect(new MissionsNotFoundError()).toBeTruthy();
  });
});
