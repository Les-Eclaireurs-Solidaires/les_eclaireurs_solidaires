import { CanActivateFn, Router } from '@angular/router';
import {  UserStateService } from '../services/user-state.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const userStateService = inject(UserStateService);
  const router = inject(Router);

  return toObservable(userStateService.isReady).pipe(
    filter((ready) => ready === true),
    take(1),
    map(() => {
      if (userStateService.isAuthenticated()) {
        return true;
      }
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};
