 import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthStateService } from '../../services/auth-state.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authApiService = inject(AuthApiService);
  const authStateService = inject(AuthStateService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);



  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ✅ Déjà présent, bien
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        return authApiService.refreshToken().pipe(
          switchMap(() => next(req.clone())),
          catchError((refreshError: HttpErrorResponse) => {
            notificationService.showError(refreshError.error.message);
            authStateService.clear();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};