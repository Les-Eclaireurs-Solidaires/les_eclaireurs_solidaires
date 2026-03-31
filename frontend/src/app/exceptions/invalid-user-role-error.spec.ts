import { InvalidUserRoleError } from './invalid-user-role-error';

describe('InvalidUserRoleError', () => {
  it('should create an instance', () => {
    expect(new InvalidUserRoleError()).toBeTruthy();
  });
});
