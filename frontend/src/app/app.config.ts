import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { baseUrlInterceptor } from './interceptors/baseUrl.interceptor';
import { GlobalErrorHandler } from './exceptions/global-error-handler';
import { httpErrorInterceptor } from './interceptors/http-error-interceptor';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth-service';
import { catchError, of, tap } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const userService = inject(UserService);

      return authService.refreshUser().pipe(
        tap((user) => userService.loginUser(user)),
        catchError(() => of(null)),
      );
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
        includePostRequests: false,
      }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([baseUrlInterceptor, httpErrorInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
  ],
};
