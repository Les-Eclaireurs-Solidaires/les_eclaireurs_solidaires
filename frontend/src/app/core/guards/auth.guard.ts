import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from '../../domain/authentication/services/auth-state.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated()) {
    return true;
  } else {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
};
