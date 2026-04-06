import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  PLATFORM_ID,
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
import { GlobalErrorHandler } from './exceptions/global-error-handler';
import { httpErrorInterceptor } from './interceptors/http-error-interceptor';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth-service';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { baseUrlInterceptor } from './interceptors/base-url-interceptor';
import { isPlatformBrowser } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const userService = inject(UserService);
      const platformId = inject(PLATFORM_ID);

      if (isPlatformBrowser(platformId)) {
        const auth$ = authService.refreshUser().pipe(
          tap((user) => userService.loginUser(user))
        );
        return firstValueFrom(auth$).catch(() => null); 
      }
      return Promise.resolve();
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
