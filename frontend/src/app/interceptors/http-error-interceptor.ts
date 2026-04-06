import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return throwError(() => error);
      }
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/me')) {
        return throwError(() => error);
      }
      return authService.refreshToken().pipe(
        switchMap(() => {
          return next(req);
        }),
        catchError((refreshError: HttpErrorResponse) => {
          authService.logout();
          console.log(error);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
