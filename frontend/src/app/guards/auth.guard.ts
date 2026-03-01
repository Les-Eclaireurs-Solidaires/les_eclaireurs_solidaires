import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  const isAuth = userService.IsAuthenticated;

  if (isAuth) {
  return true;
} else {
  
  router.navigate(['login'], { queryParams: { returnUrl: "benevole" } });
  return false;
}
};
