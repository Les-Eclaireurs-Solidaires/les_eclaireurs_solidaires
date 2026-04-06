import { inject } from "@angular/core";
import { AuthService } from "../services/auth-service";
import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, switchMap, throwError } from "rxjs";

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(() => next(req)),
          catchError((refreshError: HttpErrorResponse) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};